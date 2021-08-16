
export default class Company {

  // PROVIDE this.kv
  /**
   * Get the KV storage
   */
  get kv() {
    return globalThis.env.kvCompany
  }

  

}
