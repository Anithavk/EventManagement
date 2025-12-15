const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

exports.createEvent = async (req, res, next) => {
  try {
    const payload = { ...req.body, organizer: req.user._id,status: "pending", };
    const event = await Event.create(payload);
    res.json(event);
  } catch (err) {
    next(err);
  }
};
exports.updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body; // approved / rejected / cancelled

    if (!["approved", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    // permission: organizer or admin
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('ticketTypes');    
    console.log(event.ticketTypes);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};


exports.searchEvents = async (req, res, next) => {
  try {
    const { q, category, city, dateFrom, dateTo } = req.query;

    const filter = { status: "approved" }; 

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (city) filter["location.city"] = city;

    const events = await Event.find(filter);
    res.json(events);
  } catch (err) {
    next(err);
  }
};


exports.addImage = async (req, res, next) => {
  // TODO: integrate Cloudinary or S3. For now assume req.body.imageUrl contains uploaded image URL.
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.images = event.images.concat(req.body.imageUrl);
    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
};
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .select("title description image status ticketsSold revenue");

    res.json(events);
  } catch (err) {
    next(err);
  }
};




