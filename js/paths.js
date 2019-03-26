import * as settings from './settings'
import * as regex from '@liquid-labs/regex-repo'

// const authIdRegex = /^auth-id-.{1,}/

// HELPER methods

const splitPath = (path) => {
  const [pathName, query] = path.split('?')
  const bits = pathName.split('/')
  // We are stringent with our path and expect a leading and trailing '/'
  if (bits.shift() !== '' || bits.pop() !== '') {
    throw new Error(`Cannot extract information from a non-absolute/canonical path: '${path}'. Ensure to include a leading and trailing '/'.`)
  }

  return { bits, query }
}

// see isItemPath
const isItemPathFromBits = (bits) =>
  ((bits.length === 2 && bits[1] !== 'create')
    || (bits.length === 3 && bits[2] === 'edit'))

// API methods

// for generating paths

/**
 * `generateGlobalListPath` returns the proper path to access a resource list.
 *
 * This method performs no validation. Call `validatePath` on the result if you
 * need to check the validity of the resource name.
 */
export const generateGlobalListPath = (resourceName) => `/${resourceName}/`

/**
 * `generateContextListPath` returns the proper path to access a resource
 * within the specified context. If `ctxPubID` is falsy, the placeholder
 * ":contextID" will be inserted. If you need another placeholder, specify it.
 *
 * This method performs no validation. Call `validatePath` on the result if you
 * need to check the validity of the resource names.
 */
export const generateContextListPath = (ctxResourceName, ctxPubID, resourceName) => {
  const contextMapper =
    settings.getContextMapperForResource(resourceName, ctxResourceName)
  if (contextMapper) {
    const { mappedContext, mappedID } = contextMapper(ctxPubID)
    return `/${mappedContext}/${mappedID || ':contextID' }/${resourceName}/`
  }
  else return `/${ctxResourceName}/${ctxPubID || ':contextID'}/${resourceName}`
}

/**
 * `generateItemCreatePath` returns the proper path to create a resource.
 *
 * This method performs no validation. Call `validatePath` on the result if you
 * need to check the validity of the resource name.
 */
export const generateItemCreatePath = (resourceName) =>
  `/${resourceName}/create/`

/**
 * `generateItemViewPath` returns the proper path to view an item. If `itemID`
 * is falsy, the placeholder ':id' will be used. Specify alternate placeholder
 * if necessary.
 *
 * This method performs no validation. Call `validatePath` on the result if you
 * need to check the validity of the resource name.
 */
export const generateItemViewPath = (resourceName, itemID) =>
  `/${resourceName}/${itemID || ':id'}/`

/**
 * `generateItemEditPath` returns the proper path to edit an item. If `itemID`
 * is falsy, the placeholder ':id' will be used. Specify alternate placeholder
 * if necessary.
 *
 * This method performs no validation. Call `validatePath` on the result if you
 * need to check the validity of the resource name.
 */
export const generateItemEditPath = (resource, itemID) =>
  `/${resource}/${itemID || ':id'}/edit/`

// for testing path types and extracting info from a path

export const ACTION_MODE_VIEW = 'view'
export const ACTION_MODE_CREATE = 'create'
export const ACTION_MODE_EDIT = 'edit'

/**
 * `extractPathInfo` extracts the the information contained in a given path. The
 * result is an object with fields:
 *
 * - `resourceName` : the final, displayed resource name
 * - `pubId` : the public ID of the final, displayed resource, or `undefined`
 * - `ctxResourceName` : the name of the context resource in a context list
 *      or `undefined`
 * - `ctxPubID` : the public ID of the context resource in a context list or
 *      `undefined`
 * - `isItem` : a boolean
 * - `isList` : a boolean
 * - `actionMode` : the 'action mode' indicated by the path
 *
 * The action mode may be one of 'view', 'edit', or 'create'. This is intended
 * primarily to deterine how to render an item and list paths will always result
 * in the 'view' action mode.
 *
 * Note that the 'action mode' indicated by the path does not limit expectations
 * of the type of operations offered by a UI. It's perfectly fine to include
 * update related controls in a 'view' mode, etc.
 *
 * This method validates the path form, but does not check whether the resources
 * named are valid. Call `validatePath` on the result if you need to check the
 * validity of the resource names.
 */
export const extractPathInfo = (path = window.location.pathname) => {
  const { bits } = splitPath(path)
  const actionMode = path.endsWith('/edit/')
    ? ACTION_MODE_EDIT
    : path.endsWith('/create/')
      ? ACTION_MODE_CREATE
      : ACTION_MODE_VIEW // default

  if (isItemPathFromBits(bits)) {
    const pubID = bits[1]
    const isUUID = regex.uuid.test(pubID)
    return {
      resourceName : bits[0],
      pubID,
      isUUID,
      isItem       : true,
      isList       : false,
      actionMode }
  }
  else if (bits.length === 1) { // it's a 'global' list
    return { resourceName : bits[0], isItem : false, isList : true, actionMode }
  }
  else if (bits.length === 2) { // it's a 'create' path
    return { resourceName : bits[0], isItem : true, isList : false, actionMode }
  }
  else { // it's a context list
    const ctxPubID = bits[1]
    const isUUID = regex.uuid.test(ctxPubID)
    return {
      resourceName    : bits[2], // context list
      ctxResourceName : bits[0],
      ctxPubID,
      isUUID,
      isItem          : false,
      isList          : true,
      actionMode }
  }
}

// for path validation

/**
 * `validatePath` will check the path for proper form and known resources.
 * Will throw a descriptive `Error` if a problem is found. Returns the path so
 * it can be chained with other methods. E.g.:
 *
 *    const path = routes.validatePath(routes.generateItemEditPath('foos'))
 *    const pathInfo = routes.extractPathInfo(routes.validatePath(path))
 *
 * This method does not check wether any speciifc item or context resource
 * exists, and merely checks the form of any IDs present. Furthermore, the
 * context may be invalid due to context mapping, even if the resources named
 * are themselves valid.
 */
export const validatePath = (path = window.location.pathname) => {
  // TODO: future versions should configure and check the context settings
  // as well. I.e., X is a valid resource, but is it a valid context?
  const { resourceName, pubID, ctxResourceName, ctxPubID } =
    extractPathInfo(path)

  // First, the resources check.
  if (!settings.isResourceDefined(resourceName)) {throw new Error(`Unknown resource '${resourceName}' found in path '${path}'.`)}
  if (ctxResourceName && !settings.isResourceDefined(ctxResourceName)) {throw new Error(`Unknown context resource '${ctxResourceName}' found in path '${path}'.`)}

  // Now check the form of the ID.
  if (pubID
      && !(regex.uuid.test(pubID)
          || settings.getAltIDMatchersForResource(resourceName).some((idRegex) =>
            idRegex.test(pubID)))) {
    throw new Error(`No valid resource ID found where expected in path '${path}'. Do you need to define a valid alternate ID?`)
  }
  if (ctxPubID
      && !(regex.uuid.test(ctxPubID)
          || settings.getAltIDMatchersForResource(ctxResourceName).some((idRegex) =>
            idRegex.test(ctxPubID)))) {
    throw new Error(`No valid resource ID found where expected in path '${path}'. Do you need to define a valid alternate ID?`)
  }

  return path
}


/*
export const getDefaultListPath = (resource, context) => {
  if (context.contextResolved && !context.contextError) {
    let contextItem = null
    const contextInfo =
      contextSettings.getContexts().ordering.find(contextInfo => {
        contextItem = context[contextSettings.getContexts().info[contextInfo[0]].itemName]
        return Boolean(contextItem)
      })
    if (contextInfo) {
      // TODO: if this returns null, try the next available context until all contextSettings.getContexts() have been checked, then throw error.
      return getContextListPath(contextInfo[0], resource, false)
    }
  }
  else {
    // eslint-disable-next-line no-console
    console.warn("Generating default list path without setting context or in the presence of a context error will fallback to the globar resource list. This may not be the intent.")
  }
  // if we get to this point, just fallback to global
  return getGlobalListPath(resource)
}*/
