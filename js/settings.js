const settings = {
  altIdMatchers  : {},
  resourcesMap   : {},
  contextMappers : {},
}

// API methods

// for managing alternate Ids
/**
 * `getAltIdMatchers` returns an object defining valid 'alternate Ids'. The
 * object keys are resource names and the value is a regular expression which
 * will test for valid Ids.
 */ // TODO: return a deep copy for safety
export const getAltIdMatchers = () => Object.assign({}, settings.altIdMatchers)

export const getAltIdMatchersForResource = (resourceName) => {
  const matchers = settings.altIdMatchers[resourceName]
  return (matchers && matchers.slice(0)) || []
}

export const addAltIdMatcher = (resourceName, idRegexOrArr) => {
  if (!settings.altIdMatchers[resourceName]) {
    settings.altIdMatchers[resourceName] = []
  }
  if (Array.isArray(idRegexOrArr)) {
    settings.altIdMatchers[resourceName] =
      settings.altIdMatchers[resourceName].concat(idRegexOrArr)
  }
  else {
    settings.altIdMatchers[resourceName].push(idRegexOrArr)
  }
}

export const setAltIdMatchers = (refresh) => // TODO: verify refresh object in non-production environment
  settings.altIdMatchers = refresh

// for managing valid resources
export const isResourceDefined = (resourceName) =>
  settings.resourcesMap[resourceName] !== undefined

export const addResource = (resourceName) =>
  settings.resourcesMap[resourceName] = true

export const setResources = (refresh) => settings.resourcesMap = refresh

// for managing context mapping
export const getContextMapperForResource = (resourceName, ctxResourceName) =>
  (settings.contextMapper[resourceName]
    && settings.contextMappers[resourceName][ctxResourceName])

export const addContextMapper = (resourceName, ctxResourceName, mapper) => {
  if (!settings.contextMappers[resourceName]) {
    settings.contextMappers[resourceName] = {}
  }
  settings.contextMappers[resourceName][ctxResourceName] = mapper
}

export const setResourceMappers = (refresh) => settings.contextMappers = refresh
