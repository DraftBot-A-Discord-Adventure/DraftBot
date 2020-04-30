const fs = require('fs');
require('colors');

let events = require('data/text/Events.json');
let eventsFr = (require('data/text/fr.json')).events;
let eventsEn = (require('data/text/en.json')).events;
let possibilitiesFr = (require('data/text/fr.json')).possibilities;
let possibilitiesEn = (require('data/text/en.json')).possibilities;
let possibilities = Object.entries(events.possibility);

possibilities.forEach((value, key) => {
  if (value[0] !== 'report') {

    let data = {
      'translations': {
        'fr': eventsFr[key],
        'en': eventsEn[key],
      },
      'possibilities': Object.assign({}, ...Object.entries(possibilities[key][1])
          .map(value => ({
            [value[0]]: Object.entries(value[1]).map(content => {
              return {
                translations: {
                  'fr': (possibilitiesFr[key][value[0]] !== undefined) ? possibilitiesFr[key][value[0]][content[0]] : "TODO",
                  'en': (possibilitiesFr[key][value[0]] !== undefined) ? possibilitiesEn[key][value[0]][content[0]] : "TODO"
                },
                timeLost: parseInt(content[1].timeLost),
                healthPointsChange: parseInt(content[1].healthPointsChange),
                newEffect: content[1].newEffect,
                xpGained: parseInt(content[1].xpGained),
                moneyGained: parseInt(content[1].moneyGained),
                item: (content[1].timeLost === "true"),
              };
            }),
          }))),
    };

    console.log(` > + ./events/${key}.json`.green);
    console.log(` > ${JSON.stringify(data).substr(0, 80)}...`.blue);

    fs.writeFile(`ressources/text/events/${key}.json`,
        JSON.stringify(data, null, '\t'), () => {});

  }
});
