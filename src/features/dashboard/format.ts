// Dates are formatted on the server in UTC and labelled as such, so the output
// does not depend on the server's time zone and needs no client JS.
const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** e.g. "Sep 29, 2026, 10:05 AM UTC" */
export function formatDateTimeUtc(date: Date): string {
  return `${dateTimeFormat.format(date)} UTC`;
}
