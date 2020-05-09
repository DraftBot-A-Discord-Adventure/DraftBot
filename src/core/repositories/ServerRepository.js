  /**
   * TODO 2.0 refactor
   * Allow to get the validation informations of a guild
   * @param {*} guilde - The guild that has to be checked
   */
  getValidationInfos(guilde) {
    let nbMembres = guilde.members.filter(member => !member.user.bot).size;
    let nbBot = guilde.members.filter(member => member.user.bot).size;
    let ratio = Math.round((nbBot / nbMembres) * 100);
    let validation = ':white_check_mark:';
    if (ratio > 30 || nbMembres < 30 || (nbMembres < 100 && ratio > 20)) {
      validation = ':x:';
    } else {
      if (ratio > 20 || nbBot > 15 || nbMembres < 100) {
        validation = ':warning:';
      }
    }
    return {validation, nbMembres, nbBot, ratio};
  }
