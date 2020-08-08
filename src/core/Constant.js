// Defines allowed datasource
global.DATASOURCE = {
  SQLITE: 'sqlite',
  JSON: 'json',
};

// Effect
global.EFFECT = {
  BABY: ':baby:',
  SMILEY: ':smiley:',
  AWAITINGANSWER: ':clock10:', // may be deleted : is used to avoir interaction when the bot is awaiting an answer
  DEAD: ':skull:',
  SLEEPING: ':sleeping:',
  DRUNK: ':zany_face:',
  FROZEN: ':cold_face:',
  HURT: ':head_bandage:',
  SICK: ':sick:',
  LOCKED: ':lock:',
  INJURED: ':dizzy_face:',
  OCCUPIED: ':clock2:',
  CONFOUNDED: ':confounded:',
};

global.LANGUAGE = {
  FRENCH: 'fr',
  ENGLISH: 'en',
};

// Object nature
global.NATURE = {
  NONE: 0,
  HEALTH: 1,
  SPEED: 2,
  DEFENSE: 3,
  ATTACK: 4,
  HOSPITAL: 5,
  MONEY: 6,
};

global.PERMISSION = {
  ROLE: {
    BOTOWNER: 'owner', // is the owner of the bot
    BADGEMANAGER: 'manager', // has the badge manager role
    SUPPORT: 'support', // has the support role
    ADMINISTRATOR: 'administrator', // has the admin permission in a server where the bot is.
    TOURNAMENT: 'tournament', // has the permission to use the tournament command
    CONTRIBUTORS: 'contributors',
    ALL: 'all',
  },
};

global.REWARD_TYPES = {
  PERSONAL_XP: 'personalXP',
  GUILD_XP: 'guildXp',
  MONEY: 'money',
  FIXED_MONEY: 'fixedMoney',
  BADGE: 'badge',
  FULL_HEAL: 'fullHeal',
  PARTIAL_HEAL: 'partialHeal',
  ALTERATION: 'alterationHeal',
};

global.ITEMTYPE = {
  POTION: 'potions',
  WEAPON: 'weapons',
  ARMOR: 'armors',
  OBJECT: 'objects',
};

global.GUILD = {
  MAX_GUILD_MEMBER: 6,
  MAX_GUILDNAME_SIZE: 15,
  MIN_GUILDNAME_SIZE: 2,
};

global.MENU_REACTION = {
  ACCEPT: '✅',
  DENY: '❌',
};

global.PROGRESSBARS_SIZE = 20;

global.FIGHT = {
  MAX_DEFENSE_IMPROVEMENT: 20,
  MAX_SPEED_IMPROVEMENT: 30,
  MAX_TURNS: 25,
  REQUIRED_LEVEL: 8,
  POINTS_REGEN_MINUTES: 15,
  POINTS_REGEN_AMOUNT: 50,
  ACTION: {
    QUICK_ATTACK: 0,
    SIMPLE_ATTACK: 1,
    POWERFUL_ATTACK: 2,
    IMPROVE_DEFENSE: 3,
    IMPROVE_SPEED: 4,
    ULTIMATE_ATTACK: 5,
  },
};

global.SHOP = {
  QUESTION: '❓',
  HOSPITAL: '🏥',
  HEART: '💗',
  MONEY_MOUTH: '🤑',
  STAR: '⭐',
  POTION_REPLACEMENT: '🍷',
  CANCEL: '❌'
};

global.TOPGG = {
  BADGE: '🗳️',
  BADGE_DURATION: 12,
  ROLE_DURATION: 24
};

