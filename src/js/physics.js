/**
 * @typedef {Object} PhysicsContact
 * @property {THREE.Vector3} displacement
 * @property {THREE.Vector3} normal
 * @property {THREE.Vector3} world
 * @property {THREE.Vector3} center
 * @property {PhysicsTriangle} triangle
 * @property {number} penetration
 */

class PhysicsCapsule {
    /**
     * @param {number} radius
     * @param {number} height
     * @param {THREE.Vector3} up
     */
    constructor(radius, height, up = new THREE.Vector3(0, 1, 0)) {
        this.radius = radius;
        this.height = height;
        this.up = up;
    }
}

const _line = new THREE.Line3();

class PhysicsTriangle {
    /**
     * @param {THREE.Vector3} p0
     * @param {THREE.Vector3} p1
     * @param {THREE.Vector3} p2
     */
    constructor(p0, p1, p2) {
        this.triangle = new THREE.Triangle(p0, p1, p2);
        this.plane = this.triangle.getPlane(new THREE.Plane());
    }
    
    /**
     * @param {THREE.Vector3} point
     * @param {THREE.Vector3} target
     */
    closestPointToPoint(point, target) {
        return this.triangle.closestPointToPoint(point, target);
    }

    static _normal = new THREE.Vector3();
    static _point = new THREE.Vector3();

    /**
     * @param {THREE.Vector3} A
     * @param {THREE.Vector3} B
     * @returns {THREE.Vector3}
     */
    closestPointToSegment(A, B, target = new THREE.Vector3()) {
        const segmentNormal = PhysicsTriangle._normal;
        const point = PhysicsTriangle._point;

        segmentNormal.subVectors(B, A).normalize();
        const a = this.plane.normal.dot(segmentNormal);

        // segment parallel to triangle
        if (a === 0) 
            return target.copy(A);

        point.subVectors(this.triangle.a, A).divideScalar(a);
        const t = this.plane.normal.dot(point);
        const i = point.copy(A).addScaledVector(segmentNormal, t);

        this.triangle.closestPointToPoint(i, target);
        _line.set(A, B);
        _line.closestPointToPoint(target, true, target);

        return target;
    }
}

class PhysicsScene {
    constructor() {
        /** @type {PhysicsTriangle[]} */
        this.triangles = [];
    }

    static _b = new THREE.Vector3();
    static _center = new THREE.Vector3();
    static _closest = new THREE.Vector3();

    /**
     * @param {PhysicsCapsule} capsule
     * @param {THREE.Vector3} position
     */
    getCapsuleContacts(capsule, position) {
        const contacts = [];

        const center = PhysicsScene._center;
        const closest = PhysicsScene._closest;

        const A = position;
        const B = PhysicsScene._b;
        B.copy(A).addScaledVector(capsule.up, capsule.height - capsule.radius * 2);
        
        this.triangles.forEach((triangle) => {
            triangle.closestPointToSegment(A, B, center);
            triangle.closestPointToPoint(center, closest);
            const penetration = capsule.radius - closest.distanceTo(center);

            if (penetration > 0) {
                const displacement = closest.clone().sub(center);
                const normal = displacement.clone().multiplyScalar(-1).normalize();
                contacts.push({ 
                    displacement,
                    normal, 
                    penetration, 
                    world: closest, 
                    center, 
                    triangle,
                });
            }
        });

        return contacts;
    }
}

class KinematicGuy {
    constructor() {
        this.gravity = 9;
        this.maxSlopeAngle = (Math.PI * .5) * .55;
        this.stepHeight = .6;
        this.jumpControl = .5;
        this.maxVelocity = 10;

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

        this.scene = new PhysicsScene();
        this.capsule = new PhysicsCapsule(.25, .8);

        /** @type {PhysicsContact[]} */
        this.contacts = [];
        /** @type {THREE.Plane[]} */
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
        // trying to understand...
        // slide (finish early if blocked)
        // if blocked:
        //     try: step up (including step down)
        //     else: finish slide
        // if sliding from ground:
        //     try: step down to ground 

        const targetMotion = moveVelocity.clone().multiplyScalar(deltaTime);
        const actualMotion = targetMotion.clone(); // ehhh
        const correction = new THREE.Vector3();

        this.traces = [];

        if (this.gravity === 0) {
            this.fly(targetMotion);
            this.testPosition.copy(this.nextPosition);
            this.updateContacts();
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
                    this.gravityVelocity.addScaledVector(this.upVector, -this.gravity * deltaTime);

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
            this.updateContacts();

            const stopAtObstacle = this.hadGroundContact || this.isSteppingUp;
            this.isSteppingUp = false;

            const blocked = !this.slide(targetMotion, stopAtObstacle);

            if (blocked) {
                this.testPosition.copy(this.prevPosition);

                this.isSteppingUp = jumpVelocity === 0 && this.stepUp(targetMotion);
                if (!this.isSteppingUp) {
                    this.slide(targetMotion, false);
                }
            }

            const jumping = this.jumpVelocity.manhattanLength() > 0 || jumpVelocity > 0;
            const grounded = this.hadGroundContact || this.isSteppingDown;

            if (this.testPosition.manhattanDistanceTo(this.prevPosition) > 100) {
                console.log("FUCKED BEFORE DOWN")
            }

            if (!this.isSteppingUp && grounded && !jumping && !this.isClimbing) {
                this.isSteppingDown = this.stepDown(!this.isSteppingDown, "walking");
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

            this.updateContacts();
            this.hadGroundContact = this.hasGroundContact();

            actualMotion.subVectors(this.testPosition, this.prevPosition);
            const upwards = this.upVector.dot(actualMotion) > 0;

            if (!jumping && upwards) {
                this.gravityVelocity.set(0, 0, 0);
            }

            // ehh
            this.nextPosition.copy(this.testPosition);
        }

        this.prevPosition.copy(this.nextPosition);
    }

    /**
     * @param {THREE.Vector3} motion
     */
    fly(motion) {
        const slideIterations = 4;
        const boundIterations = 4;
        
        // motion will be perturbed by sliding
        const targetMotion = motion;
        const actualMotion = targetMotion.clone();

        const prevPosition = this.prevPosition;
        const nextPosition = this.prevPosition.clone().add(actualMotion);
        
        let contacts = this.scene.getCapsuleContacts(this.capsule, nextPosition);
        
        /** @type {THREE.Plane[]} */
        let bounds = [];

        let solvedContacts = false;
        for (let i = 0; i < slideIterations && !solvedContacts; ++i) {
            this.addContactBounds(bounds, contacts, nextPosition);

            let solvedBounds = bounds.length === 0;
            for (let j = 0; j < boundIterations && !solvedBounds; ++j) {
                solvedBounds = true;
                for (let bound of bounds) {
                    // ignore non-opposing bounds
                    if (bound.normal.dot(actualMotion) >= 0) continue;

                    // distance to plane..
                    const test = this.prevPosition.clone().add(actualMotion);
                    const distance = bound.distanceToPoint(test);
                    const inside = distance + this.allowedPenetration < 0;

                    if (inside) {
                        // update motion
                        actualMotion.addScaledVector(bound.normal, -distance);
                        solvedBounds = false;
                    }
                }
            }

            const opposing = targetMotion.dot(actualMotion) <= 0;
            if (!solvedBounds || opposing) break;

            nextPosition.copy(prevPosition).add(actualMotion);
            contacts = this.scene.getCapsuleContacts(this.capsule, nextPosition);

            solvedContacts = this.filterForbiddenContacts(contacts, actualMotion).length === 0;
        }

        if (!solvedContacts) {
            this.nextPosition.copy(prevPosition);
        } else {
            this.nextPosition.copy(nextPosition);
        }
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

        this.updateContacts();

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
                    const distance = bound.distanceToPoint(this.testPosition);
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
                console.log("V ISSUE?")
            }

            this.testPosition.copy(this.prevPosition).add(actualMotion);
            this.updateContacts();

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

        this.updateContacts();
        if (this.hasForbiddenContact()) return false;

        return !blocked;
    }

    /**
     * @param {THREE.Vector3} motion
     */
    stepUp(motion) {
        const prevPosition = this.testPosition;
        const nextPosition = prevPosition.clone();

        const targetMotion = motion;

        const forward = targetMotion.clone().projectOnVector(this.upVector);
        forward.subVectors(targetMotion, forward);

        // if entirely vertical motion, cancel
        if (forward.manhattanLength() === 0)
            return false;
        forward.normalize();

        const forwardStepDistance = this.capsule.radius - 2 * this.allowedPenetration;
        const forwardStep = forward.clone().multiplyScalar(forwardStepDistance);
        const upwardStep = this.upVector.clone().multiplyScalar(this.stepHeight);

        // is there room to step up?
        nextPosition.add(forwardStep).add(upwardStep);
        const contacts = this.scene.getCapsuleContacts(this.capsule, nextPosition);
        const blocked = this.filterForbiddenContacts(contacts).length > 0;

        if (!blocked) {
            // is there something to stand on?
            this.testPosition.copy(nextPosition);
            this.updateContacts();
            const groundContact = this.stepDown(true, "step up");
            if (groundContact) {
                return true;
            }
        }

        // couldn't step, rollback
        this.testPosition.copy(prevPosition);
        this.updateContacts();

        return false;
    }

    /**
     * @param {boolean} onlyOntoAllowedSlopes
     * @returns {boolean}
     */
    stepDown(onlyOntoAllowedSlopes, source="none") {
        const slideIterations = 8;
        const boundIterations = 4;

        if (this.hasForbiddenContact()) {
            console.log("STEPPING DOWN BUT ALREADY FUCKED", source)
        }

        this.updateContacts();
        // we're already on the ground
        if (this.hasGroundContact())
            return true;

        // ???
        if (this.stepHeight === 0)
            return true;

        const startPosition = this.testPosition.clone();
        const targetMotion = this.upVector.clone().multiplyScalar(-this.stepHeight*.6);
        const actualMotion = targetMotion.clone();
        const safeMotion = new THREE.Vector3();

        this.testPosition.copy(startPosition).add(actualMotion);

        let hasUnallowedContacts = false;
        let hasBottomContact = false;
        let foundAllowedSlope = false;
        
        // hmmmm not necessary???
        let bisect = false;//true;

        this.bounds.length = 0;
        for (let i = 0; i < slideIterations && (hasUnallowedContacts || !hasBottomContact || (bisect && this.contacts.length === 0)); ++i) {
            this.addBounds(this.testPosition);

            let solvedBounds = this.bounds.length === 0;
            for (let j = 0; j < boundIterations && !solvedBounds; ++j) {
                solvedBounds = true;
                for (let bound of this.bounds) {
                    // ignore downwards bounds (really steep walls are a problem...)
                    if (bound.normal.dot(this.upVector) <= 0) continue;

                    // distance to plane..
                    const distance = bound.distanceToPoint(this.testPosition) + this.allowedPenetration;
                    const inside = distance < 0;

                    // dunno
                    if (distance < this.allowedPenetration) {
                        hasBottomContact = true;
                        foundAllowedSlope = foundAllowedSlope || this.isAllowedSlope(bound.normal);
                    }

                    if (inside) {
                        // something fucky here: the more vertical the bound,
                        // the huger the correction.. i'll clamp for now

                        // depentrate vertically only
                        const d = -distance / this.upVector.dot(bound.normal);
                        
                        if (d <= 0.01) {
                            actualMotion.addScaledVector(this.upVector, d);
                        } else {
                            actualMotion.addScaledVector(bound.normal, -distance);
                        }

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
            this.updateContacts();

            hasUnallowedContacts = this.hasForbiddenContact();

            bisect = bisect || hasUnallowedContacts;

            if (hasUnallowedContacts) {
                targetMotion.copy(actualMotion);
            } else {
                safeMotion.copy(actualMotion); 
            }
        }

        this.testPosition.copy(startPosition).add(actualMotion);
        this.updateContacts();
        hasUnallowedContacts = this.hasForbiddenContact();

        if (hasUnallowedContacts || !hasBottomContact || (onlyOntoAllowedSlopes && !foundAllowedSlope))
        {
            this.lastStepDown.copy(this.testPosition);

            this.testPosition.copy(startPosition);
            this.updateContacts(); 
            return false;
        }

        return true;
    }

    updateContacts() {
        this.contacts = this.scene.getCapsuleContacts(this.capsule, this.testPosition);
    }

    /**
     * @param {THREE.Vector3} motion
     */
    hasForbiddenContact(motion = new THREE.Vector3(0, 0, 0)) {
        const stationary = motion.manhattanLength() == 0;

        return this.contacts.some((contact) => {
            const opposing = stationary || motion.dot(contact.normal) < 0;
            const inside = contact.penetration > this.allowedPenetration;
            return inside && opposing;
        });
    }

    /**
     * @param {PhysicsContact[]} contacts
     * @param {THREE.Vector3} motion
     */
    filterForbiddenContacts(contacts, motion = new THREE.Vector3(0, 0, 0)) {
        const stationary = motion.manhattanLength() == 0;

        return contacts.filter((contact) => {
            const opposing = stationary || motion.dot(contact.normal) < 0;
            const inside = contact.penetration > this.allowedPenetration;
            return inside && opposing;
        });
    }

    hasGroundContact() {
        this.groundContacts = this.filterGroundContacts(this.contacts);
        return this.groundContacts.length > 0;
    }

    /**
     * @param {PhysicsContact[]} contacts
     */
    filterGroundContacts(contacts) {
        const maxDisplacement = -this.capsule.radius * Math.cos(this.maxSlopeAngle);
        return contacts.filter((contact) => contact.displacement.y <= maxDisplacement);
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
        this.addContactBounds(this.bounds, this.contacts, position);
    }

    /**
     * @param {THREE.Plane[]} bounds
     * @param {PhysicsContact[]} contacts
     * @param {THREE.Vector3} position
     */
    addContactBounds(bounds, contacts, position) {
        const point = new THREE.Vector3();

        contacts.forEach((contact) => {
            point.copy(position).addScaledVector(contact.normal, contact.penetration);
            const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(contact.normal, point);
            const exists = bounds.some((bound) => plane.equals(bound));            
            if (exists) return;

            // arrange bounds so walls are always solved before ramps
            const wall = this.isAllowedSlope(plane.normal);

            if (wall) {
                bounds.splice(0, 0, plane);
            } else {
                bounds.push(plane);
            }
        });
    }
}
