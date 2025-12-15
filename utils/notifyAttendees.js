const Ticket = require("../models/Ticket");
const sendEmail = require("./sendemail");

const notifyAttendees = async (eventId, message) => {
  const tickets = await Ticket.find({ event: eventId }).populate("user");

  for (const ticket of tickets) {
    if (ticket.user?.email) {
      await sendEmail({
        to: ticket.user.email,
        subject: "Event Schedule Update",
        html: `
          <h2>Event Update</h2>
          <p>${message}</p>
          <p>Please check the event page for latest details.</p>
        `,
      });
    }
  }
};

module.exports = notifyAttendees;
