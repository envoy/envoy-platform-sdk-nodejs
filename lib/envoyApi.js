const request = require('request-promise-native')

class EnvoyApi {
  constructor (baseUrl) {
    this.baseUrl = baseUrl
  }
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
