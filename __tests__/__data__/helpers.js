/**
 * Patch am Item record from Zotero with some of the methods we use to verify
 * behavior in tests
 * @param {object} data
 * @returns {ZoteroGenericItem}
 */
function createItem(data) {
  const methods = {
    getField: function (field) {
      if (field === 'year') {
        // this is cheeky but fits the profile of the field
        return this.date.substring(this.date.length - 4);
      }

      return this[field];
    },
    getCreators: function () {
      return this.creators;
    },
    setField: function (field, info) {
      this[field] = info;
    },
    saveTx: function () {
      return;
    },
  };
  return { ...data, ...methods };
}

module.exports = { createItem };
