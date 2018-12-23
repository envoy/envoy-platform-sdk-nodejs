const request = require('request-promise-native')

/**
 * Helper to make envoy api calls based on request metadata.
 *
 * @typedef {Object} EnvoyApi
 */
class EnvoyApi {
  /**
   * Helper to make envoy api calls based on request metadata.
   *
   * @property {string} baseUrl - base url to make the api calls from
   */
  constructor (baseUrl) {
    this.baseUrl = baseUrl
  }

  /**
   * Updates event status of a hub event. Useful for updating hub event status from a route.
   *
   * @property {string} eventReportId - hub event id
   * @property {string} statusSummary - readable status message of the event
   * @property {"in_progress"|"failed"|"done"|"ignored"} eventStatus - database friendly status
   * @example
   * await this.envoyApi.updateEventReport('11:22:33', 'Queued')
   */
  async updateEventReport (eventReportId, statusSummary, eventStatus = 'in_progress', failureReason = null) {
    let eventReportUrl = `${this.baseUrl}/a/hub/v1/event_reports/${eventReportId}`
    return request.put(eventReportUrl, {
      json: true,
      body: {
        status: eventStatus,
        status_message: statusSummary,
        failure_reason: failureReason
      }
    })
  }
}

module.exports = EnvoyApi
