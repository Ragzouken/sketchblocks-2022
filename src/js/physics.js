/**
 * @typedef {Object} Plane
 * @property {THREE.Vector3} normal
 * @property {number} distance
 */

/**
 * @typedef {Object} PhysicsContact
 * @property {THREE.Vector3} displacement
 * @property {THREE.Vector3} normal
 * @property {THREE.Vector3} world
 * @property {THREE.Vector3} center
 * @property {PhysicsTriangle} triangle
 * @property {number} penetration
 */

function makePlane() {
    return {
        normal: new THREE.Vector3(),
        distance: 0,
    }
}

/**
 * @param {Plane} plane
 * @param {THREE.Vector3} point
 * @returns {number}
 */
function planePointDistance(plane, point) {
    return plane.normal.dot(point) - plane.distance;
}

/**
 * @param {THREE.Vector3} t0
 * @param {THREE.Vector3} t1
 * @param {THREE.Vector3} t2
 * @param {THREE.Vector3} p
 */
 function pointIsInTriangle(t0, t1, t2, p) {
	// triangle relative to point
	const a = t0.clone().sub(p);
	const b = t1.clone().sub(p);
	const c = t2.clone().sub(p);

    // normals
	const normPBC = b.clone().cross(c); // Normal of PBC (u)
	const normPCA = c.clone().cross(a); // Normal of PCA (v)
	const normPAB = a.clone().cross(b); // Normal of PAB (w)

    // testing normal direction somehow..
    const test1 = normPBC.dot(normPCA) <= 0;
    const test2 = normPBC.dot(normPAB) <= 0;

    return !test1 && !test2;
}

/**
 * @param {THREE.Vector3} l0
 * @param {THREE.Vector3} l1
 * @param {THREE.Vector3} p
 */
function closestPointLine(l0, l1, p) { 
    const v = l1.clone().sub(l0);
    let t = p.clone().sub(l0).dot(v) / v.dot(v);
    t = Math.max(t, 0);
    t = Math.min(t, 1);
    return v.multiplyScalar(t).add(l0);
}

/**
 * @param {THREE.Vector3} t0
 * @param {THREE.Vector3} t1
 * @param {THREE.Vector3} t2
 * @param {THREE.Vector3} p
 * @returns {{ point: THREE.Vector3, normal: THREE.Vector3 }}
 */
function closestPointTriangle(t0, t1, t2, p) {
    const closest = new THREE.Vector3();

    // triangle plane
    const t10 = t1.clone().sub(t0);
    const t20 = t2.clone().sub(t0);
    const tN = t10.clone().cross(t20).normalize();
    const tD = tN.clone().dot(t0);

    // closest on plane
    const d = tN.clone().multiplyScalar(tN.dot(p) - tD);
    closest.subVectors(p, d);

    if (pointIsInTriangle(t0, t1, t2, closest)) {
        return { point: closest, normal: tN };
    }

    // closest point on each edge
	const c1 = closestPointLine(t0, t1, closest); // Line AB
	const c2 = closestPointLine(t1, t2, closest); // Line BC
	const c3 = closestPointLine(t2, t0, closest); // Line CA

    // pick closest of those
    const l1 = closest.clone().sub(c1).lengthSq();
    const l2 = closest.clone().sub(c2).lengthSq();
    const l3 = closest.clone().sub(c3).lengthSq();

    if (l1 < l2 && l1 < l3) {
        return { point: c1, normal: tN };
    } else if (l2 < l1 && l2 < l3) {
        return { point: c2, normal: tN };
    }
    return { point: c3, normal: tN };
}

class PhysicsTriangle {
    /**
     * @param {THREE.Vector3} p0
     * @param {THREE.Vector3} p1
     * @param {THREE.Vector3} p2
     */
    constructor(p0, p1, p2) {
        this.p0 = p0.clone();
        this.p1 = p1.clone();
        this.p2 = p2.clone();

        const p10 = p1.clone().sub(p0);
        const p20 = p2.clone().sub(p0);

        this.plane = makePlane();
        this.plane.normal.copy(p10).cross(p20).normalize();
        this.plane.distance = this.plane.normal.dot(p0);
    }

    /**
     * @param {THREE.Vector3} point
     * @returns {THREE.Vector3}
     */
    closestPoint(point) {
        const closest = new THREE.Vector3();

        // closest on plane
        closest.copy(this.plane.normal);
        closest.multiplyScalar(this.plane.normal.dot(point) - this.plane.distance);
        closest.subVectors(point, closest);

        if (pointIsInTriangle(this.p0, this.p1, this.p2, closest)) {
            return closest;
        }
    
        // closest point on each edge
        const c1 = closestPointLine(this.p0, this.p1, closest); // Line AB
        const c2 = closestPointLine(this.p1, this.p2, closest); // Line BC
        const c3 = closestPointLine(this.p2, this.p0, closest); // Line CA
    
        // pick closest of those
        const l1 = closest.clone().sub(c1).lengthSq();
        const l2 = closest.clone().sub(c2).lengthSq();
        const l3 = closest.clone().sub(c3).lengthSq();
    
        if (l1 < l2 && l1 < l3) {
            return c1;
        } else if (l2 < l1 && l2 < l3) {
            return c2;
        }
        return c3;
    }

    /**
     * @param {THREE.Vector3} A
     * @param {THREE.Vector3} B
     * @returns {THREE.Vector3}
     */
    closestPointSegment(A, B) {
        const capsuleNormal = B.clone().sub(A).normalize();

        const a = this.plane.normal.dot(capsuleNormal);

        if (a === 0) 
            return A.clone();

        const f = 1 / this.plane.normal.dot(capsuleNormal);
        const p = this.p0.clone().sub(A).multiplyScalar(f);
        const t = this.plane.normal.dot(p);
        const i = capsuleNormal.clone().multiplyScalar(t).add(A);

        const c1 = this.closestPoint(i);
        const c2 = closestPointLine(A, B, c1);

        return c2;
    }
}

class KinematicGuy {
    constructor() {
        this.radius = .25;
        this.height = .8;
        this.gravity = 9;
        this.maxSlopeAngle = (Math.PI * .5) * .65;
        this.stepHeight = .6;
        this.jumpControl = .5;
        this.maxVelocity = 20;

        this.allowedPenetration = 0.01;
        this.upVector = new THREE.Vector3(0, 1, 0);

        this.prevPosition = new THREE.Vector3();
        this.testPosition = new THREE.Vector3();
        this.nextPosition = new THREE.Vector3();
        
        this.hadGroundContact = false;
        this.isSteppingUp = false;
        this.isSteppingDown = false;
        this.isClimbing = false;
        this.jumpVelocity = new THREE.Vector3();
        this.gravityVelocity = new THREE.Vector3();

        this.lastStepUp = new THREE.Vector3();
        this.lastStepDown = new THREE.Vector3();

        /** @type {PhysicsTriangle[]} */
        this.triangles = [];
        /** @type {PhysicsContact[]} */
        this.contacts = [];
        /** @type {Plane[]} */
        this.bounds = [];

        /** @type {PhysicsContact[]} */
        this.groundContacts = [];
    }

    /**
     * @param {THREE.Vector3} moveVelocity
     * @param {number} jumpVelocity
     * @param {number} deltaTime
     */
    move(moveVelocity, jumpVelocity, deltaTime) {
        const targetMotion = moveVelocity.clone().multiplyScalar(deltaTime);
        const actualMotion = targetMotion.clone(); // ehhh
        const correction = new THREE.Vector3();

        this.testPosition.copy(this.prevPosition);

        if (this.gravity === 0) {
            this.fly(targetMotion);
        } else {
            const climbing = this.isClimbing && this.jumpVelocity.y + this.gravityVelocity.y <= 0;
            const airborne = !this.hadGroundContact && !climbing && !this.isSteppingUp;
 
            if (!airborne) {
                // supported and can jump
                this.gravityVelocity.set(0, 0, 0);
                this.jumpVelocity.copy(this.upVector).multiplyScalar(jumpVelocity);

                correction.copy(this.jumpVelocity).multiplyScalar(deltaTime);
                targetMotion.add(correction); // ehhh
            } else {
                // TODO: jump control

                // remove vertical
                correction.copy(targetMotion).projectOnVector(this.upVector);
                targetMotion.sub(correction);

                // jumping shit
                correction.copy(this.upVector).multiplyScalar(jumpVelocity);
                this.jumpVelocity.max(correction);
                correction.copy(this.jumpVelocity).multiplyScalar(deltaTime);
                targetMotion.add(correction);

                if (jumpVelocity > 0) {
                    // jumping, ignore gravity for now
                    this.gravityVelocity.set(0, 0, 0);
                } else {
                    // Apply gravity velocity using the exact equation of motion.
                    const lastGravity = this.gravityVelocity.clone();

                    // v' = v + g∙t
                    correction.copy(this.upVector).multiplyScalar(-this.gravity * deltaTime);
                    this.gravityVelocity.add(correction);

                    if (this.gravityVelocity.lengthSq() > this.maxVelocity * this.maxVelocity)
                        this.gravityVelocity.clampLength(0, this.maxVelocity);

                    // s' = s + v∙t + 1/2∙g∙t² 
                    //    = s + 1/2∙(v' + v)t 
                    correction.copy(this.gravityVelocity).add(lastGravity).multiplyScalar(.5 * deltaTime);
                    targetMotion.add(correction);
                }
            }

            targetMotion.clampLength(0, this.maxVelocity * deltaTime);

            this.testPosition.copy(this.prevPosition);
            this.updateContacts(this.testPosition);

            const stopAtObstacle = this.hadGroundContact || this.isSteppingUp;
            this.isSteppingUp = false;
            const blocked = !this.slide(targetMotion, stopAtObstacle);

            if (blocked) {
                this.isSteppingUp = this.stepUp(targetMotion);
                if (!this.isSteppingUp) { 
                    this.slide(targetMotion, false);
                }
            }

            const jumping = this.jumpVelocity.manhattanLength() > 0;
            const grounded = this.hadGroundContact || this.isSteppingDown;

            if (!this.isSteppingUp && grounded && !jumping && !this.isClimbing) {
                this.isSteppingDown = this.stepDown(!this.isSteppingDown);
            } else {
                this.isSteppingDown = false;
            }

            // limit motion
            const maxMotionLength = !this.isSteppingDown 
                ? targetMotion.length() 
                : this.maxVelocity * deltaTime;

            // const testMotion = this.testPosition.clone().sub(this.prevPosition);
            // const testMotionLength = testMotion.length();
            // if (testMotionLength > maxMotionLength) {
            //     console.log("TOO MUCH", testMotionLength, maxMotionLength)
            //     this.testPosition.copy(actualMotion).multiplyScalar(maxMotionLength / testMotionLength).add(this.prevPosition);
            //     actualMotion.copy(this.testPosition).sub(this.prevPosition);
            //     this.updateContacts(this.testPosition);
            // } 

            this.hadGroundContact = this.hasGroundContact();

            actualMotion.subVectors(this.testPosition, this.prevPosition);
            const upwards = this.upVector.dot(actualMotion) > 0;

            if (!jumping && upwards) {
                this.gravityVelocity.set(0, 0, 0);
            }

            // ehh
            this.nextPosition.copy(this.testPosition);
        }
    }

    fly(motion) {
        const slideIterations = 4;
        const boundIterations = 4;
        
        // motion will be perturbed by sliding
        const targetMotion = motion;
        const actualMotion = targetMotion.clone();

        this.testPosition.copy(this.prevPosition);
        this.updateContacts(this.testPosition);

        const correction = new THREE.Vector3();

        let solvedContacts = false;
        this.bounds.length = 0;
        for (let i = 0; i < slideIterations && !solvedContacts; ++i) {
            this.addBounds(this.testPosition);

            let solvedBounds = this.bounds.length === 0;
            for (let j = 0; j < boundIterations && !solvedBounds; ++j) {
                solvedBounds = true;
                for (let bound of this.bounds) {
                    // ignore non-opposing bounds
                    if (bound.normal.dot(actualMotion) >= 0) continue;

                    // distance to plane..
                    
                    const test = this.prevPosition.clone().add(actualMotion);
                    const distance = planePointDistance(bound, test);
                    const inside = distance + this.allowedPenetration < 0;

                    if (inside) {
                        // update motion
                        correction.copy(bound.normal).multiplyScalar(-distance)
                        actualMotion.add(correction);

                        solvedBounds = false;
                    }
                }
            }

            const opposing = targetMotion.dot(actualMotion) <= 0;
            if (!solvedBounds || opposing) break;

            this.testPosition.copy(this.prevPosition).add(actualMotion);
            this.updateContacts(this.testPosition);

            solvedContacts = !this.hasForbiddenContact(actualMotion);
        }

        if (!solvedContacts) {
            this.nextPosition.copy(this.prevPosition);
        } else {
            this.nextPosition.copy(this.testPosition);
        }

        this.updateContacts(this.nextPosition);
    }

    /**
     * @param {THREE.Vector3} motion
     * @param {boolean} stopAtObstacle
     */
    slide(motion, stopAtObstacle) {
        const slideIterations = 4;
        const boundIterations = 4;

        const targetMotion = motion;
        const actualMotion = targetMotion.clone();

        const targetDirection = targetMotion.clone().normalize();
        const targetDirectionVertical = this.upVector.clone().multiplyScalar(this.upVector.dot(targetDirection));
        const targetDirectionHorizontal = targetMotion.clone().sub(targetDirectionVertical);

        //this.testPosition.copy(this.prevPosition);
        this.updateContacts(this.testPosition);

        const correction = new THREE.Vector3();

        let blocked = false;
        let noSlide = false;
        let onlyLateral = false;

        const startedOnGround = this.hasGroundContact();

        let solvedContacts = false;
        this.bounds.length = 0;
        for (let i = 0; i < slideIterations && !solvedContacts; ++i) {
            this.addBounds(this.testPosition);

            let solvedBounds = this.bounds.length === 0;
            for (let j = 0; j < boundIterations && !solvedBounds; ++j) {
                solvedBounds = true;
                for (let bound of this.bounds) {
                    // ignore non-opposing bounds
                    if (bound.normal.dot(actualMotion) >= 0) continue;

                    // distance to plane..
                    const distance = planePointDistance(bound, this.testPosition);
                    const inside = distance + this.allowedPenetration < 0;

                    if (inside) {
                        // different resolution to fly
                        correction.copy(bound.normal).multiplyScalar(-distance);

                        if (this.isAllowedSlope(bound.normal)) {
                            // all good
                        } else if (stopAtObstacle) {
                            // back off rather than sliding
                            const d = -distance / bound.normal.dot(targetDirection);
                            correction.copy(targetDirection).multiplyScalar(d);
                            blocked = true;
                        } else if (noSlide) {
                            // back off horizontally
                            const d = -distance / bound.normal.dot(targetDirectionHorizontal);
                            correction.copy(targetDirectionHorizontal).multiplyScalar(d);
                        } else if (onlyLateral || correction.dot(this.upVector) > 0) {                            
                            // slide without vertical component
                            correction.copy(this.upVector).multiplyScalar(bound.normal.dot(this.upVector));
                            correction.subVectors(bound.normal, correction);
                            
                            if (correction.manhattanLength() > 0) {
                                correction.normalize();
                                const d = -distance / bound.normal.dot(correction);
                                correction.multiplyScalar(d);
                            }
                        }

                        actualMotion.add(correction);
                        this.testPosition.copy(this.prevPosition).add(actualMotion);

                        solvedBounds = false;
                    }
                }
            }

            if (!solvedBounds) {
                // V issue
            }

            this.testPosition.copy(this.prevPosition).add(actualMotion);
            this.updateContacts(this.testPosition);

            // was this a ground based movement that resulted in opposing motion?
            const opposingHorizontal = targetDirectionHorizontal.dot(actualMotion) <= -this.allowedPenetration;
            if (startedOnGround && opposingHorizontal)
            {
                blocked = true;
                break;
            }

            solvedContacts = !this.hasForbiddenContact(actualMotion);

            // don't slide down when motion is exclusively falling
            const targetDownwards = this.upVector.dot(targetDirection) === -1;
            const actualDownwards = this.upVector.dot(actualMotion) <= 0;
            
            if (solvedContacts && startedOnGround && targetDownwards && actualDownwards) {
                solvedContacts = false;
                break;
            }
        }

        return !blocked;
    }

    /**
     * @param {THREE.Vector3} motion
     */
    stepUp(motion) {
        const startPosition = this.testPosition.clone();

        const targetMotion = motion;

        const forward = targetMotion.clone().projectOnVector(this.upVector);
        forward.subVectors(targetMotion, forward);

        // if entirely vertical motion, cancel
        if (forward.manhattanLength() === 0)
            return false;
        forward.normalize();

        const forwardStepDistance = this.radius*.5 - 2 * this.allowedPenetration;
        const forwardStep = forward.clone().multiplyScalar(forwardStepDistance);
        const upwardStep = this.upVector.clone().multiplyScalar(this.stepHeight);

        // is there room to step up?
        this.testPosition.add(forwardStep).add(upwardStep);
        this.updateContacts(this.testPosition);

        const blocked = this.hasForbiddenContact();
        if (!blocked) {
            // is there something to stand on?
            const groundContact = this.stepDown(true);
            if (groundContact) {
                this.lastStepUp.copy(this.testPosition);
                return true;
            }
        }

        // couldn't step, rollback
        this.testPosition.copy(startPosition);
        this.updateContacts(this.testPosition);

        return false;
    }

    /**
     * @param {boolean} onlyOntoAllowedSlopes
     * @returns {boolean}
     */
    stepDown(onlyOntoAllowedSlopes) {
        const slideIterations = 8;
        const boundIterations = 4;

        // we're already on the ground
        if (this.hasGroundContact())
            return true;

        // ???
        if (this.stepHeight === 0)
            return true;

        const startPosition = this.testPosition.clone();
        const targetMotion = this.upVector.clone().multiplyScalar(-this.stepHeight);
        const actualMotion = targetMotion.clone();
        const safeMotion = new THREE.Vector3();

        this.testPosition.copy(startPosition).add(actualMotion);

        const correction = new THREE.Vector3();

        let hasUnallowedContacts = false;
        let hasBottomContact = false;
        let foundAllowedSlope = false;
        let bisect = true;

        this.bounds.length = 0;
        for (let i = 0; i < slideIterations && (hasUnallowedContacts || !hasBottomContact || (bisect && this.contacts.length === 0)); ++i) {
            this.addBounds(this.testPosition);

            let solvedBounds = this.bounds.length === 0;
            for (let j = 0; j < boundIterations && !solvedBounds; ++j) {
                solvedBounds = true;
                for (let bound of this.bounds) {
                    // ignore downwards bounds
                    if (bound.normal.dot(this.upVector) <= 0) continue;

                    // distance to plane..
                    const distance = planePointDistance(bound, this.testPosition) + this.allowedPenetration;
                    const inside = distance < 0;

                    // dunno
                    if (distance < this.allowedPenetration) {
                        hasBottomContact = true;
                        foundAllowedSlope = foundAllowedSlope || this.isAllowedSlope(bound.normal);
                    }

                    if (inside) {
                        // depentrate vertically only
                        const d = -distance / this.upVector.dot(bound.normal);
                        correction.copy(this.upVector).multiplyScalar(d);
                        
                        actualMotion.add(correction);
                        this.testPosition.copy(startPosition).add(actualMotion);

                        solvedBounds = false;
                    }
                }
            }

            const downDistance = -this.upVector.dot(actualMotion);
            const safeDistance = -this.upVector.dot(safeMotion);
            const progress = downDistance > safeDistance;

            // give up if we couldn't solve bounds or make progress initially
            if (i === 0 && (!solvedBounds || !progress))
                break;
            
            const noOverallMotion = startPosition.clone().add(actualMotion).sub(this.testPosition).manhattanLength() === 0;

            // give up if we haven't moved after second iteration
            if (i > 0 && noOverallMotion) {
                if (!bisect) break;

                this.bounds.length = 0;

                actualMotion.copy(safeMotion).add(targetMotion).multiplyScalar(.5);
                this.testPosition.copy(startPosition).add(actualMotion);
            }
            
            if (!solvedBounds && !progress) {
                this.bounds.length = 0;
                hasBottomContact = false;

                actualMotion.copy(safeMotion).add(targetMotion).multiplyScalar(.5);
                this.testPosition.copy(startPosition).add(actualMotion);
            }

            this.testPosition.copy(startPosition).add(actualMotion);
            this.updateContacts(this.testPosition);

            hasUnallowedContacts = this.hasForbiddenContact();

            bisect = bisect || hasUnallowedContacts;

            if (hasUnallowedContacts) {
                targetMotion.copy(actualMotion);
            } else {
                safeMotion.copy(actualMotion); 
            }
        }

        if (hasUnallowedContacts || !hasBottomContact || (onlyOntoAllowedSlopes && !foundAllowedSlope))
        {
            this.lastStepDown.copy(this.testPosition);

            this.testPosition.copy(startPosition);
            this.updateContacts(this.testPosition);
            return false;
        }

        this.lastStepDown.copy(this.testPosition);
        return true;
    }

    updateContacts(position) {
        this.contacts.length = 0;

        const A = position;
        const B = this.upVector.clone().multiplyScalar(this.height-this.radius*2).add(position);

        this.triangles.forEach((triangle) => {
            const center = triangle.closestPointSegment(A, B);
            const closest = triangle.closestPoint(center);
            const displacement = closest.clone().sub(center);
            const penetration = this.radius - displacement.length();

            if (penetration > 0) {
                const normal = displacement.clone().multiplyScalar(-1).normalize();
                this.contacts.push({ displacement, normal, penetration, world: closest, center, triangle });
            }
        });
    }

    /**
     * @param {THREE.Vector3} motion
     */
    hasForbiddenContact(motion = new THREE.Vector3(0, 0, 0))
    {
        const stationary = motion.manhattanLength() == 0;

        for (let i = 0; i < this.contacts.length; ++i) {
            const contact = this.contacts[i];
            const opposing = motion.dot(contact.normal) < 0;
            const inside = contact.penetration > this.allowedPenetration + 0.001;

            if ((stationary || opposing) && inside) return true;
        }

        return false;
    }

    hasGroundContact() {
        const maxDisplacement = -this.radius * Math.cos(this.maxSlopeAngle);

        this.groundContacts.length = 0;
        for (const contact of this.contacts) {
            if (contact.displacement.y <= maxDisplacement) {
                this.groundContacts.push(contact);
                //console.log(maxDisplacement, contact.displacement.y);
            }
        }

        return this.groundContacts.length > 0;
    }

    /**
     * @param {THREE.Vector3} normal
     */
    isAllowedSlope(normal) {
        return this.upVector.dot(normal) >= Math.cos(this.maxSlopeAngle);
    }

    /**
     * @param {THREE.Vector3} position
     */
    addBounds(position) {
        const point = new THREE.Vector3();

        this.contacts.forEach((contact) => {
            point.copy(contact.normal);
            point.multiplyScalar(contact.penetration);
            point.add(position);

            const plane = {
                normal: contact.normal,
                distance: contact.normal.dot(point),
            };

            // TODO: ignore duplicates
            
            // arrange bounds so walls are always solved before ramps
            const wall = this.isAllowedSlope(plane.normal);

            if (wall) {
                this.bounds.splice(0, 0, plane);
            } else {
                this.bounds.push(plane);
            }
        });
    }
}
