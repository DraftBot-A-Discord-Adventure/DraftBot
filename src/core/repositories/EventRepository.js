
  /**
   * Get randomly an event, exclude event 0
   * @return {Promise<Event>}
   */
  async getRandom() {
    const id = Math.round(Math.random() * (Object.keys(this.events).length - 1)) + 1;
    return this.events[id];
  }
