/* global describe expect test */
import * as paths from './paths'
import * as settings from './settings'

settings.addResource('places')
settings.addResource('persons')
settings.addAltIDMatcher('persons', /^self$/)

const testUUID = 'C6B4E077-91F1-4BC3-A857-42EFC7B9D247'

describe('paths', () => {
  describe('generateGlobalListPath', () => {
    test('works with known resources', () => {
      expect(paths.generateGlobalListPath('persons')).toBe('/persons/')
    })

    test('works with unknown resources', () => {
      expect(paths.generateGlobalListPath('foos')).toBe('/foos/')
    })
  })

  describe('extractPathInfo', () => {
    test('decomposes standard "get-by-ID" construction', () => {
      expect(paths.extractPathInfo(`/persons/${testUUID}/`)).toEqual({
        resourceName: 'persons',
        pubID: testUUID,
        isItem: true,
        isList: false,
        actionMode: paths.ACTION_MODE_VIEW
      })
    })

    test(`decomposes alternate "self-ID" for configured resource`, () => {
      expect(paths.extractPathInfo(`/persons/self/`)).toEqual({
        resourceName: 'persons',
        pubID: 'self',
        isItem: true,
        isList: false,
        actionMode: paths.ACTION_MODE_VIEW
      })
    })

    test('properly decomposes item paths for unknown resources', () => {
      const result = {
        resourceName: 'foos',
        pubID: testUUID,
        isItem: true,
        isList: false,
        actionMode: paths.ACTION_MODE_VIEW
      }
      expect(paths.extractPathInfo(`/foos/${testUUID}/`)).toEqual(result)
      result.pubID = 'self'
      expect(paths.extractPathInfo(`/foos/self/`)).toEqual(result)
    })
  })

  describe('validatePath', () => {
    test.each([
      `/persons/`,
      `/persons/create/`,
      `/persons/${testUUID}/`,
      `/persons/${testUUID}/edit/`,
      `/places/${testUUID}/persons/`])
    (`passes valid path '%s' without complaint`, (path) => {
      expect(paths.validatePath(path)).toBe(path)
    })

    test('raises an error given an unknown item list path', () => {
      expect(() => paths.validatePath('/foos/')).toThrow(/Unknown resource/)
    })

    test('raises an error given an unrecognized item ID form', () => {
      expect(() => paths.validatePath('/persons/john/')).toThrow(/No valid resource ID/)
    })
  })
})
