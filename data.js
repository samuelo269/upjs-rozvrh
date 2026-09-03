/* Jediný zdroj pravdy pre rozvrh. Úprava predmetu = úprava jedného riadku tu. */

var CONFIG = {
  semester: 'Zimný semester 2026/2027',
  frequency: 'TYZ',
  startDate: '2026-09-14',
  endDate: '2026-12-18',
  dayStart: '07:00',
  dayEnd: '19:00',
  days: [
    { full: 'Pondelok', short: 'Po' },
    { full: 'Utorok', short: 'Ut' },
    { full: 'Streda', short: 'St' },
    { full: 'Štvrtok', short: 'Št' },
    { full: 'Piatok', short: 'Pi' }
  ]
};

/* type: P = prednáška, C = cvičenie/prax, S = seminár, O = voliteľná možnosť
   day:  0 = pondelok … 4 = piatok
   tag:  nepovinný štítok namiesto farebnej značky typu (napr. "Voľba 1") */
var LESSONS = [
  // ---- Pondelok ----
  { day: 0, type: 'C', code: 'PPgU - C', name: 'Psychológia a pedagogická psychológia pre učiteľov', shortName: 'Psychológia pre učiteľov', start: '07:05', end: '08:35', room: 'AS3S3', teacher: 'Barbierik', typeLabel: 'Cvičenie' },
  { day: 0, type: 'P', code: 'PaD - P', name: 'Pedagogika a didaktika pre učiteľov', shortName: 'Pedagogika a didaktika', start: '08:55', end: '10:25', room: '—', teacher: '—', typeLabel: 'Prednáška' },
  { day: 0, type: 'C', code: 'ZZP - C', name: 'Zážitková pedagogika', start: '10:45', end: '12:15', room: 'AA0S2', teacher: 'Petríková', typeLabel: 'Cvičenie' },
  { day: 0, type: 'C', code: 'AETLmu - C', name: 'Americké etnické literatúry pre AJALm AJEIEm', shortName: 'Americké etnické literatúry', start: '15:20', end: '16:50', room: 'AP1P1', teacher: 'Buráková', typeLabel: 'Cvičenie' },
  { day: 0, type: 'S', code: 'DBaI - S', name: 'Dejiny Balkánu po 2. sv. vojne', shortName: 'Dejiny Balkánu', start: '16:15', end: '17:00', room: 'AP2S11', teacher: 'Melichárek', typeLabel: 'Seminár' },
  { day: 0, type: 'P', code: 'DBaI - P', name: 'Dejiny Balkánu po 2. sv. vojne', shortName: 'Dejiny Balkánu', start: '17:10', end: '17:55', room: 'AP2P4', teacher: 'Melichárek', typeLabel: 'Prednáška' },

  // ---- Utorok ----
  { day: 1, type: 'P', code: 'PPgU - P', name: 'Psychológia a pedagogická psychológia pre učiteľov', shortName: 'Psychológia pre učiteľov', start: '08:00', end: '09:30', room: 'AK0A7', teacher: 'Barbierik (+1)', typeLabel: 'Prednáška' },
  { day: 1, type: 'C', code: 'PsZ - C', name: 'Psychológia zdravia', start: '08:55', end: '10:25', room: 'AS3S3', teacher: 'Liptáková', typeLabel: 'Cvičenie' },
  { day: 1, type: 'P', code: 'KzH - P', name: 'Vybrané kapitoly z dejín historiografie', shortName: 'Kapitoly z historiografie', start: '13:30', end: '15:00', room: 'AP2P4', teacher: 'Borza (+1)', typeLabel: 'Prednáška' },
  { day: 1, type: 'P', code: 'SDaM - P', name: 'Sociológia detí a mládeže', start: '14:25', end: '15:55', room: 'RE0A6', teacher: 'Onufrák', typeLabel: 'Prednáška' },
  { day: 1, type: 'O', code: 'Fm - P', name: 'Fenomén motorizmu', start: '17:10', end: '17:55', room: 'AP2S11', teacher: 'Jančura', typeLabel: 'Prednáška (Voľba 1)', tag: 'Voľba 1' },
  { day: 1, type: 'O', code: 'ZZP - P', name: 'Zážitková pedagogika', start: '17:10', end: '17:55', room: 'AA1P2', teacher: 'Orosová', typeLabel: 'Prednáška (Voľba 2)', tag: 'Voľba 2' },

  // ---- Streda ----
  { day: 2, type: 'C', code: 'USCU - C', name: 'Súčasné USA', start: '11:40', end: '13:10', room: 'AP0S3', teacher: 'Rozenfeld', typeLabel: 'Cvičenie' },
  { day: 2, type: 'O', code: 'DIAJmu1 - C', name: 'Didaktika angličtiny 1 pre AJALm', shortName: 'Didaktika angličtiny 1', start: '12:35', end: '14:05', room: 'AP1S9 / AS1L9', teacher: 'Szabó', typeLabel: 'Cvičenie (2 skupiny)', tag: '2 skupiny' },
  { day: 2, type: 'S', code: 'Fm - S', name: 'Fenomén motorizmu', start: '16:15', end: '17:00', room: 'AP0S4', teacher: 'Jančura', typeLabel: 'Seminár' },
  { day: 2, type: 'S', code: 'KzH - S', name: 'Vybrané kapitoly z dejín historiografie', shortName: 'Kapitoly z historiografie', start: '16:15', end: '17:00', room: 'AP1S8', teacher: 'Švigárová', typeLabel: 'Seminár' },

  // ---- Štvrtok ----
  { day: 3, type: 'C', code: 'MPPa - C', name: 'Hospitačná náčuvová pedagogicko-psychologická prax', start: '07:05', end: '14:35', room: '—', teacher: 'Barbierik (+3)', typeLabel: 'Cvičenie', note: 'Blok 1.10. – 12.11.' },
  { day: 3, type: 'C', code: 'GSTm - C', name: 'Rodové štúdiá', start: '15:20', end: '16:50', room: 'AP1P2', teacher: 'Filipová', typeLabel: 'Cvičenie' },
  { day: 3, type: 'P', code: 'PaD - P', name: 'Pedagogika a didaktika pre učiteľov', shortName: 'Pedagogika a didaktika', start: '17:10', end: '18:40', room: '—', teacher: '—', typeLabel: 'Prednáška' },

  // ---- Piatok ----
  { day: 4, type: 'P', code: 'HVP - P', name: 'História vo verejnom priestore', start: '10:45', end: '11:30', room: 'AP2S11', teacher: 'Śnieżko', typeLabel: 'Prednáška' },
  { day: 4, type: 'S', code: 'HVP - S', name: 'História vo verejnom priestore', start: '11:40', end: '12:25', room: 'AP2S11', teacher: 'Śnieżko', typeLabel: 'Seminár' }
];
