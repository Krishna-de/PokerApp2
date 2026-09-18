// Silly tournament names built from wars, myths and legends.

const FULL_NAMES = [
  'The Siege of Troy (Nobody Bring a Horse)',
  'Ragnarök & Roll',
  'Clash of the Titans (and Their Short Stacks)',
  'The Thirty Years’ Blind War',
  'Operation Desert Fold',
  'The Battle of Hastings Bluffs',
  'Zeus’s Lightning Shove',
  'The Odyssey: 10 Years to Hit a Flush',
  'Achilles’ Heel-and-Rebuy',
  'Medusa’s Stone Cold Bluff',
  'The Trojan Nuts',
  'Valhalla or Bust',
  'Thor’s Hammer Time',
  'Loki’s Slow Roll',
  'The Spartan 300 Big Blinds',
  'Hannibal Crosses the River Card',
  'Napoleon’s Short Stack',
  'The Hundred Years’ Hand',
  'Sun Tzu’s Art of the Check-Raise',
  'Pandora’s Pot',
  'The Labours of Hercules: Pot Odds Edition',
  'Poseidon’s Deep Stack',
  'Icarus Flew Too Close to the All-In',
  'Anubis Weighs Your Chips',
  'Cleopatra’s Pocket Queens',
  'The Minotaur’s Maze of Limps',
  'Genghis Khan’s Chip Conquest',
  'The Cold War of Check-Checks',
  'Kraken the Nuts',
  'Beowulf vs. The Button',
  'Odin’s One-Eyed Jacks',
  'Ares Goes Tilt',
  'The Cyclops Sees One Out',
  'King Arthur’s Round Table Rebuy',
  'The Wooden Horse Limp',
  'Excalibur in the Muck',
  'Hades Collects the Bounties',
  'Athena’s Wise Fold',
  'Waterloo on the River',
  'The Viking Rebuy Raid',
];

const HEROES = ['Zeus', 'Thor', 'Loki', 'Odin', 'Ares', 'Hades', 'Athena', 'Achilles', 'Hercules', 'Medusa', 'Napoleon', 'Caesar', 'Genghis', 'Spartacus', 'Cleopatra', 'Anubis', 'Poseidon', 'Leonidas'];
const THINGS = ['Bluff', 'Shove', 'Slow Roll', 'Short Stack', 'Rebuy', 'Bad Beat', 'Hero Call', 'Pocket Aces', 'River Rat', 'Check-Raise', 'Tilt', 'Bounty Hunt'];
const EVENTS = ['Siege', 'Crusade', 'Last Stand', 'Invasion', 'Uprising', 'Blitz', 'Showdown', 'Rebellion', 'Conquest', 'Revenge'];

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomTournamentName(current?: string) {
  for (let i = 0; i < 10; i += 1) {
    const name =
      Math.random() < 0.6
        ? pick(FULL_NAMES)
        : Math.random() < 0.5
          ? `${pick(HEROES)}’s ${pick(THINGS)} ${pick(EVENTS)}`
          : `The ${pick(EVENTS)} of the ${pick(THINGS)}`;
    if (name !== current) return name;
  }
  return pick(FULL_NAMES);
}
