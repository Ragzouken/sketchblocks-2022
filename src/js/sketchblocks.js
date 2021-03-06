/**
 * @typedef {Object} BlocksDataDesign
 * @property {number} id
 * @property {string} name
 * @property {number} thumb
 * @property {number[]} data
 */

/**
 * @typedef {Object} BlocksDataShape
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {number[]} BlocksDataBlock
 */

/**
 * @typedef {Object} BlocksDataCharacter
 * @property {number} id
 * @property {number[]} position
 * @property {number} tile
 * @property {string} dialogue
 */

/**
 * @typedef {Object} BlocksDataProject
 * @property {BlocksDataDesign[]} designs
 * @property {BlocksDataShape[]} shapes
 * @property {BlocksDataBlock[]} blocks
 * @property {BlocksDataCharacter[]} characters
 * @property {string} tileset
 */