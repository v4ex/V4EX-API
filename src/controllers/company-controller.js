import AuthController from './auth-controller.js'


export default class CompanyController extends AuthController {

  // ==========================================================================
  // /company/{companyName}

  // OVERRIDDEN
  // PROVIDE this.canHandle
  get canHandle() {
    if (this.url.pathname.startsWith('/company')) {
      return true
    }
    return false
  }

  // ENV AUTH0_MANAGEMENT_TOKEN
  // OVERRIDDEN
  async handleRequest() {
    const authenticated = await this.authenticate().catch(error => {
      return new Response("Error happened in authorization.", { status: 401 })
    })

    if (authenticated) {

      switch (this.method) {
        case 'GET': {
          const entity = await this.getLatestRevision()

          if (entity) {
            return new Response(JSON.stringify(entity), {status: 200})
          } else {
            return new Response("Not Found", {status: 404})
          }

          break
        }
        case 'POST': {
          if (await this.checkIfEntityExist()) {
            return new Response("Forbidden", { status: 403 })
          } else {
            // TODO Handle error
            await this.kv.put(this.newRevisionKey, this.request.body)
            return new Response("OK", { status: 200 })
          }

          break
        }
        case 'PUT': {
          // TODO Handle error
          await this.kv.put(this.newRevisionKey, this.request.body)
          return new Response("OK", { status: 200 })

          break
        }
        case 'DELETE': {
          const itemsList = await this.kv.list({
            prefix: this.companyName
          })
          for (const item of itemsList.keys) {
            await this.kv.delete(item.name)
          }
          return new Response("OK", { status: 200 })

          break
        }
        default: {
          return new Response("Bad Request", { status: 400 })
        }
      }

    } else {
      return new Response("Unauthorized", { status: 401 })
    }
  }

  // ==========================================================================
  // 

  // PROVIDE this.companyName
  get companyName() {
    return this.url.pathname.split('/')[2]
  }

  // PROVIDE this.kv
  /**
   * Get the KV storage
   */
   get kv() {
    return globalThis.env.kvCompany
  }

  async getCompanyObject() {
    return await this.request.json()
  }

  async checkIfEntityExist() {
    const entitiesList = await this.kv.list({
      prefix: this.companyName
    })

    return entitiesList.keys.length > 0
  }

  async getLatestRevisionKey() {
    // TODO Handle more than 1000 revisions
    const entitiesList = await this.kv.list({
      prefix: this.companyName
    })

    // console.log(`entitiesList`, entitiesList) // DEBUG
    
    return entitiesList.keys[entitiesList.keys.length - 1].name
  }

  async getLatestRevision() {
    return await this.kv.get(await this.getLatestRevisionKey())
  }

  // PROVIDE this.newRevisionKey
  /**
   * {CompanyName}:{RevisionNumber}
   */
  get newRevisionKey() {
    const date = new Date
    const year = date.getUTCFullYear().toString()
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = date.getUTCDate().toString().padStart(2, '0')
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    const seconds = date.getUTCSeconds().toString().padStart(2, '0')
    const milliseconds = Date.now().toString().slice(10)
    const timeString = year + month + day + hours + minutes + seconds + milliseconds

    return this.companyName + ':' + timeString
  }

}
