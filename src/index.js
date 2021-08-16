// import DevController from './controllers/dev-controller.js'

import RootController from './controllers/root-controller.js'
import CompanyController from './controllers/company-controller.js'

// import DurableObject from './durable/durable-object.js'


// TODO Configuration pre-check
// Default Handler class of "modules" format
export default {
  async fetch(request, env) {

    // console.log(`env`, env)
    globalThis.request = request
    globalThis.env = env

    // ========================================================================
    // Handle dev request
    // Route: *

    // const devController = new DevController(request, env)
    // if (devController.canHandle) {
    //   return devController.handleRequest()
    // }

    // ========================================================================
    // Handle company entity request
    // Route: /company/{companyName}

    const companyController = new CompanyController(request, env)
    if (companyController.canHandle) {
      return companyController.handleRequest()
    }

    // ========================================================================
    // Handle root request
    // Route: /
    
    const rootController = new RootController(request, env)
    if (rootController.canHandle) {
      return rootController.handleRequest()
    }

    // ========================================================================
    // Fallback

    return new Response("Not Found", { status: 404 })

  }
}
