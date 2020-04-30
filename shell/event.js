const fs = require('fs');
require('colors');

let events = require('data/text/Events.json');
let eventsFr = (require('data/text/fr.json')).events;
let eventsEn = (require('data/text/en.json')).events;

let reactions = Object.entries(events.event);
let possibilities = Object.entries(events.possibility);

reactions.forEach((value, key) => {

  let data = {
    'translations': {
      'fr': eventsFr[key],
      'en': eventsEn[key],
    },
    'reactions': Object.values(value[1]),
    'possibilities': Object.assign({}, ...Object.entries(possibilities[key][1])
        .map(value => ({
          [value[0]]: Object.values(value[1]).map(value => {
            return {
              timeLost: parseInt(value.timeLost),
              healthPointsChange: parseInt(value.healthPointsChange),
              newEffect: value.newEffect,
              xpGained: parseInt(value.xpGained),
              moneyGained: parseInt(value.moneyGained),
              item: (value.timeLost === "true"),
            };
          }),
        }))),
  };

  console.log(` > + ./events/${key}.json`.green);
  console.log(` > ${JSON.stringify(data).substr(0, 80)}...`.blue);

  fs.writeFile(`ressources/text/events/${key}.json`,
      JSON.stringify(data, null, '\t'), () => {});
});
