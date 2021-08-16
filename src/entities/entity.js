import DurableData from '../durable/durable-data.js'

// ============================================================================
// 



// ============================================================================
// Create new entity
// Add revision to the entity
// Use a durable object to store an array of all the revisions of the entity

export default class Entity {

  // entity_id | entity_revision_id
  constructor(id) {
    this.kv = globalThis.env.kvEntity

    this.entityId = id

    this.durableData = new DurableData(globalThis.env.doEntity, this.entityId)

    this.type

  }

  // OVERRIDE
  // PROVIDE this.type
  get type() {
    return 'entity'
  }

  async save() {

  }

  async load() {

  }

  async create() {

  }



}

// ============================================================================
// Entity Writer
// Durable Object

class EntityWriter {

  #kv
  #queue

  constructor(state, env) {
    this.#queue = {}
    this.#kv = env.kvEntity
  }

  async fetch(request) {
    const url = new URL(request.url)
    const parts = url.split('/')
    const type = parts[1]
    const entity = await request.json()
    if (entity.type !== type) {
      return
    }

    this.#queue[type] = this.#queue[type] || []
    this.#queue[type].push(entity)
  }

}
