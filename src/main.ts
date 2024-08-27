/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The entrypoint for the action.
 */
import * as core from '@actions/core'
import jsonDiff from 'json-diff'

export const run: () => void = () => {
  try {
    const planJsonString = core.getInput('plan-json')
    const planJson: any = JSON.parse(planJsonString)
    const shouldUpdateTaskSummary: boolean =
      core.getInput('should-update-task-summary') === 'true'

    const allNonNoOpObjects = planJson.resource_changes.filter(
      (resource: any) => resource.change.actions.includes('no-op')
    )

    let markdown = '' // To save you the trouble – yes `+=` is the fastest way to build strings: https://jsperf.app/join-concat/2 (and it's not even close)
    for (const resource of allNonNoOpObjects) {
      const diff = jsonDiff.diffString(
        resource.change.before,
        resource.change.after,
        { color: false }
      )

      markdown += `## ${resource.address}\n\n`
      markdown += '```diff\n'
      markdown += diff
      markdown += '```\n\n'

      if (shouldUpdateTaskSummary) {
        core.summary.addRaw(markdown)
      }
    }
    core.debug(`Diff as markdown: ${markdown}`)
    core.setOutput('diff-as-markdown', markdown)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
