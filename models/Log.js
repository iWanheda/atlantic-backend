const schema = new mongoose.Schema({
  type: Number,
  userIds: Array,
  receiverIds: Array,
  houseId: String,
  vehicle: Object,
  item: Object,
  timestamp: Number,
});

const InventoryLog = mongoose.model("Inventory", schema);
const HouseLog = mongoose.model("House", schema);
const TrunkLog = mongoose.model("Trunk", schema);

module.exports = { InventoryLog, HouseLog, TrunkLog };
