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
            const key = this.newRevisionKey
            await this.kv.put(key, this.request.body)

            return new Response(key, { status: 200 })
          }

          break
        }
        case 'PUT': {
          const key = this.newRevisionKey
          // TODO Handle error
          await this.kv.put(key, this.request.body)

          return new Response(key, { status: 200 })

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

  getFetchUrl({prefix, limit, cursor}) {
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CLOUDFLARE_KV_COMPANY_ID}/keys`
    const fetchUrl = new URL(apiUrl)
    fetchUrl.searchParams.append('prefix', prefix ?? this.companyName)
    fetchUrl.searchParams.append('limit', limit ?? 1000)
    fetchUrl.searchParams.append('cursor', cursor ?? ';')
    
    return fetchUrl
  }

  // ENV CLOUDFLARE_ACCOUNT_ID
  // ENV CLOUDFLARE_KV_COMPANY_ID
  // ENV CLOUDFLARE_API_TOKEN
  async checkIfEntityExist() {
    const response = await fetch(this.getFetchUrl({limit: 10}), {
      headers: {
        authorization: `bearer ${globalThis.env.CLOUDFLARE_API_TOKEN}`
      }
    })
    const data = await response.json()

    return data.result_info.count > 0
  }

  // ENV CLOUDFLARE_ACCOUNT_ID
  // ENV CLOUDFLARE_KV_COMPANY_ID
  // ENV CLOUDFLARE_API_TOKEN
  async getLatestRevisionKey() {
    let response, data
    do {
      response = await fetch(this.getFetchUrl(), {
        headers: {
          authorization: `bearer ${globalThis.env.CLOUDFLARE_API_TOKEN}`
        }
      })
      data = await response.json()
      fetchUrl.searchParams.set('cursor', data.result_info.cursor)
    } while (data.result_info.cursor)

    // console.log(`data`, data) // DEBUG
    
    return data.result[data.result_info.count - 1].name
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
