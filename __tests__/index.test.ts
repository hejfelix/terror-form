/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/index'


// Mock the GitHub Actions core library
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>
let addRawMock: jest.SpiedFunction<typeof core.summary.addRaw>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    addRawMock = jest.spyOn(core.summary, 'addRaw').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
  })

  it('fails on empty json', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'should-update-task-summary':
          return 'true'
        case 'plan-json':
          return '{}'
        default:
          return ''
      }
    })

    setOutputMock.mockImplementation((_name, _value) => {})
    addRawMock.mockImplementation((_markdown, _addEOL) => {
      return {} as any
    })

    main.run()

    expect(setFailedMock).toHaveBeenCalledWith(
      "Cannot read properties of undefined (reading 'filter')"
    )
  })

  it('works', async () => {
    const json = JSON.stringify(
      {
        resource_changes: [
          {
            change: {
              actions: ['no-op'],
              before: { foo: 'bar' },
              after: { foo: 'baz' }
            },
            address: 'module.foo.bar'
          }
        ]
      },
      null,
      0
    )

    console.log(json)
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'should-update-task-summary':
          return 'true'
        case 'plan-json':
          return json
        default:
          return ''
      }
    })

    setOutputMock.mockImplementation((_name, _value) => {})
    addRawMock.mockImplementation((_markdown, _addEOL) => {
      return {} as any
    })

    const expectedOutput = `## module.foo.bar

\`\`\`diff
 {
-  foo: "bar"
+  foo: "baz"
 }
\`\`\`

`
    main.run()

    expect(setOutputMock).toHaveBeenCalledWith(
      'diff-as-markdown',
      expectedOutput
    )
  })
})
