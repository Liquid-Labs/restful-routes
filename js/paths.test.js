/* global describe expect test */
import * as paths from './paths'
import * as settings from './settings'

settings.addResource('places')
settings.addResource('persons')
settings.addAltIdMatcher('persons', /^self$/)

const testUuid = 'C6B4E077-91F1-4BC3-A857-42EFC7B9D247'

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
    test('decomposes standard "get-by-Id" construction', () => {
      expect(paths.extractPathInfo(`/persons/${testUuid}/`)).toEqual({
        resourceName : 'persons',
        pubId        : testUuid,
        isUuid       : true,
        isItem       : true,
        isList       : false,
        actionMode   : paths.ACTION_MODE_VIEW
      })
    })

    test(`decomposes alternate "self-Id" for configured resource`, () => {
      expect(paths.extractPathInfo(`/persons/self/`)).toEqual({
        resourceName : 'persons',
        pubId        : 'self',
        isUuid       : false,
        isItem       : true,
        isList       : false,
        actionMode   : paths.ACTION_MODE_VIEW
      })
    })

    test('properly decomposes item paths for unknown resources', () => {
      const result = {
        resourceName : 'foos',
        pubId        : testUuid,
        isUuid       : true,
        isItem       : true,
        isList       : false,
        actionMode   : paths.ACTION_MODE_VIEW
      }
      expect(paths.extractPathInfo(`/foos/${testUuid}/`)).toEqual(result)
      result.pubId = 'self'
      result.isUuid = false
      expect(paths.extractPathInfo(`/foos/self/`)).toEqual(result)
    })
  })

  describe('validatePath', () => {
    test.each([
      `/persons/`,
      `/persons/create/`,
      `/persons/${testUuid}/`,
      `/persons/${testUuid}/edit/`,
      `/places/${testUuid}/persons/`])(
      `passes valid path '%s' without complaint`, (path) => {
        expect(paths.validatePath(path)).toBe(path)
      })

    test('raises an error given an unknown item list path', () => {
      expect(() => paths.validatePath('/foos/')).toThrow(/Unknown resource/)
    })

    test('raises an error given an unrecognized item Id form', () => {
      expect(() => paths.validatePath('/persons/john/')).toThrow(/No valid resource Id/)
    })
  })
})
