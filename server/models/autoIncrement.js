const Counter = require('./Counter');

module.exports = function autoIncrement(schema, options) {
  schema.add({ _id: Number });

  schema.pre('save', async function() {
    if (this.isNew && typeof this._id !== 'number') {
      const counter = await Counter.findByIdAndUpdate(
        options.modelName,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this._id = counter.seq;
    }
  });
};
