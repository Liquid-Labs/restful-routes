const settings = {
  altIDMatchers : {},
  resourcesMap : {},
  contextMappers : {},
}

// API methods

// for managing alternate IDs
/**
 * `getAltIDMatchers` returns an object defining valid 'alternate IDs'. The
 * object keys are resource names and the value is a regular expression which
 * will test for valid IDs.
 */ // TODO: return a deep copy for safety
export const getAltIDMatchers = () => Object.assign({}, settings.altIDMatchers)

export const getAltIDMatchersForResource = (resourceName) => {
  const matchers = settings.altIDMatchers[resourceName]
  return (matchers && matchers.slice(0)) || []
}

export const addAltIDMatcher = (resourceName, idRegexOrArr) => {
  if (!settings.altIDMatchers[resourceName]) {
    settings.altIDMatchers[resourceName] = []
  }
  if (Array.isArray(idRegexOrArr)) {
    settings.altIDMatchers[resourceName] =
      settings.altIDMatchers[resourceName].concat(idRegexOrArr)
  }
  else {
    settings.altIDMatchers[resourceName].push(idRegexOrArr)
  }
}

export const setAltIDMatchers = (refresh) => // TODO: verify refresh object in non-production environment
  settings.altIDMatchers = refresh

// for managing valid resources
export const isResourceDefined = (resourceName) =>
  settings.resourcesMap[resourceName] !== undefined

export const addResource = (resourceName) =>
  settings.resourcesMap[resourceName] = true

export const setResources = (refresh) => settings.resourcesMap = refresh

// for managing context mapping
export const getContextMapperForResource = (resourceName, cxtResourceName) =>
  (settings.contextMapper[resourceName]
    && settings.contextMappers[resourceName][ctxResourceName])

export const addContextMapper = (resourceName, ctxResourceName, mapper) => {
  if (!settings.contextMappers[resourceName]) {
    settings.contextMappers[resourceName] = {}
  }
  settings.contextMappers[resourceName][ctxResourceName] = mapper
}

export const setResourceMappers = (refresh) => settings.contextMappers = refresh
