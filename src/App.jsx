import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, X, Plus, Eye, EyeOff, AlertTriangle, Check, Search, Trash2, Edit2, Save, Users, ArrowLeft, RotateCcw, ChevronDown, ChevronUp, Info, CheckCircle2, Circle, Heart, HeartOff, Printer } from 'lucide-react';

// ============================================================
// TAG TAXONOMY
// ============================================================

const PLAYER_TAGS = ['2 players', '3 players', '4 players', '5+ players', 'Solo scene', 'Tiebreaker'];
const DESCRIPTIVE_TAGS = [
  'Accent',
  'Audience participation',
  'Bell',
  'Bonus Point',
  'Complicated',
  'Genre',
  'High Energy',
  'Interruption',
  'Lightning Round',
  'Microphone',
  'Music',
  'Narrative',
  'Physical',
  'Physical Contact',
  'Replay',
  'Silent',
  'Singing',
  'Tech',
  'Thinky',
  'Verbal Restriction',
  'Zone',
];

// ============================================================
// BUILT-IN PREFERENCES (short labels)
// ============================================================
// Each preference has:
//   - id: stable identifier
//   - label: short display name
//   - kind: 'dislike' (red) or 'like' (green)
//   - flagConstraints / flagTags: capability flags / tag names that make a game conflict
//   - boostConstraints / boostTags: capability flags / tag names that make a game a good fit
// Custom user-added prefs (stored separately) just have id/label/kind plus optional flag/boost tags.

const BUILTIN_PREFERENCES = [
  { id: 'no_singing', label: 'No singing', kind: 'dislike', flagConstraints: ['singing'], flagTags: ['Singing'] },
  { id: 'no_rapid_speech', label: 'No rapid dialog', kind: 'dislike', flagConstraints: ['rapid_speech'] },
  { id: 'no_wordplay', label: 'No verbal restriction', kind: 'dislike', flagConstraints: ['wordplay'], flagTags: ['Verbal Restriction'] },
  { id: 'no_worlds_worst', label: 'No World\'s Worst', kind: 'dislike', flagConstraints: ['worlds_worst'] },
  { id: 'no_physical_contact', label: 'No physical contact', kind: 'dislike', flagConstraints: ['physical_contact'], flagTags: ['Physical Contact'] },
  { id: 'loves_audience', label: 'Loves audience', kind: 'like', boostTags: ['Audience participation'], boostConstraints: ['audience_on_stage'] },
  { id: 'loves_guessing', label: 'Loves guessing', kind: 'like', boostConstraints: ['guessing'] },
  { id: 'loves_experimental', label: 'Loves experimental', kind: 'like', boostConstraints: ['gibberish_only', 'audience_on_stage'] },
  { id: 'loves_high_energy', label: 'Loves high-energy', kind: 'like', boostTags: ['High Energy'] },
  { id: 'loves_thinky', label: 'Loves thinky', kind: 'like', boostTags: ['Thinky', 'Complicated'] },
];

// ============================================================
// GAMES DATABASE
// ============================================================

const GAMES = [
  // --- 2-PLAYER ---
  {
    id: 'questions_only',
    name: 'Questions Only',
    tags: ['2 players', 'Tiebreaker', 'High Energy', 'Verbal Restriction'],
    constraints: ['rapid_speech', 'wordplay'],
    description: 'Two performers play a scene in which every line must be a question. If a performer hesitates, makes a statement, or asks a rhetorical question, they are tagged out and replaced. Often run tournament-style.',
    delivery: 'We\'re playing Questions Only. Two performers up here [point]. Every single line you say must be a question. If you make a statement, repeat a question, or hesitate, you\'re out and someone else taps in. We need a location from the audience to start. [check players: clear?]',
  },
  {
    id: 'the_alphabet_game',
    name: 'The Alphabet Game',
    tags: ['2 players', '3 players', 'Tiebreaker', 'Verbal Restriction', 'Lightning Round', 'Complicated'],
    constraints: ['rapid_speech', 'wordplay'],
    description: 'Get two or three players onstage. Get a letter (say, "D") from the audience. The first line of dialog has to start with "D". The next line with "E", and so on.',
    delivery: 'The Alphabet Game. Two or three players. Audience gives us a starting letter. The first line of dialog starts with that letter. The next line with the next letter. And so on, all the way through. We need a scene location too. [check players] Letter from the audience?',
    notes: 'This game works best with discrete lines of dialog, where each line has a clear ending - overlapping dialog makes the game hard to follow. Clever players will introduce names that start with hard-to-use letters ("Seriously, Xavier...") so they can pay it off when the hard letter comes around ("Xavier!"). You can make this a lightning-round game by challenging the players to get through the whole alphabet in 60 seconds.',
    similarTo: ['letter_restriction', 'x_word_sentences', 'verbal_restriction_tiebreakers'],
  },
  {
    id: 'sound_effects',
    name: 'Sound Effects',
    tags: ['2 players', 'Microphone', 'Tech', 'Physical'],
    constraints: [],
    description: 'Have one person onstage and one person on a microphone. The onstage person performs a scene - usually doing an audience-suggested task/activity. The microphone player provides sound effects. The onstage player has to react to the sound effects.',
    delivery: 'Sound Effects. One person onstage [point], one person on the mic [point]. Audience gives the onstage person a task. The mic player provides sound effects, and the onstage player reacts to them. [check players, check tech]',
    notes: 'This usually ends up being a silent (in the sense of "dialog-free") scene. If it has dialog, it should still feel like silent comedy; it\'s all about the physical responses to the unexpected stimuli.',
  },
  {
    id: 'helping_hands',
    name: 'Helping Hands',
    tags: ['2 players', 'Audience participation', 'High Energy', 'Physical Contact'],
    constraints: ['audience_on_stage'],
    description: 'One performer stands with their arms behind their back. A second performer (or audience member) stands directly behind them and puts their arms through to be the first performer\'s hands. The front performer speaks, the back performer makes the hand gestures.',
    delivery: 'Helping Hands. One performer here with their hands tucked behind them [demonstrate]. A second person directly behind them puts their arms through to BE their hands - usually we get an audience member up for this. The front performer talks and reacts, the hands do whatever the hands want to do. We need a scenario - usually we have them making or eating something. [check players]',
  },
  {
    id: 'every_other_line',
    name: 'Every Other Line',
    tags: ['2 players', 'Audience participation', 'Complicated'],
    constraints: [],
    description: 'One performer acts a scene freely. The other holds an audience-supplied book and must respond using every other line from that book in order. The free performer ends the scene with an audience-suggested closing line.',
    delivery: 'Every Other Line. We need a book from someone in the audience right now - any book. Performer A acts a scene freely. Performer B can only respond by reading every other line from the book, in order. At the end we\'ll use an audience-suggested closing line to wrap it. [check players]',
  },
  {
    id: 'if_you_know_what_i_mean',
    name: 'If You Know What I Mean',
    tags: ['2 players'],
    constraints: [],
    description: 'Two performers play a scene where every line they speak ends with the phrase "if you know what I mean," loading innocent statements with implied innuendo.',
    delivery: 'If You Know What I Mean. Two players, scene of your choosing - we\'ll get a location. Every line you say has to end with "if you know what I mean." The fun is finding a totally innocent line and ending it with that phrase. [check players]',
  },
  {
    id: 'news_report',
    name: 'News Report',
    tags: ['2 players', 'Genre'],
    constraints: [],
    description: 'One performer is a news reporter "on the scene" of an unfolding event. They report on what\'s happening behind them, either with a green screen, projected images, or simply mimed action by silent performers.',
    delivery: 'News Report. One performer in front, reporting live from the scene of - we\'ll get a suggestion. Behind you, [the screen / our silent crew] will show you what\'s happening. You react to what you see and report on it. [check player]',
  },
  {
    id: 'audition',
    name: 'Audition',
    tags: ['Solo scene', '2 players', 'Genre'],
    constraints: [],
    description: 'A solo performer auditions for a series of increasingly absurd roles, called out by the director, one after another with no warning.',
    delivery: 'Audition. One performer. You\'re auditioning. I\'ll call out a role you\'re reading for - you launch into a one-person scene as that character - and then I\'ll cut you off and give you the next role. We\'ll do five or six. [check player]',
  },
  {
    id: 'animals',
    name: 'Animals',
    tags: ['Solo scene', '2 players', 'High Energy'],
    constraints: [],
    description: 'A performer plays out a scene as an audience-suggested animal, in an audience-suggested human situation.',
    delivery: 'Animals. One performer. We need an animal from the audience and a human situation - like, a tax audit. You play out that situation as that animal. [check player]',
  },
  {
    id: 'hat_box',
    name: 'Hat Box',
    altNames: ['Hats (Whose Line)'],
    tags: ['2 players', 'Tiebreaker', 'High Energy'],
    constraints: [],
    description: 'Two performers play a scene while drawing hats from a box. Every time they change hats, they must adjust their character to match the new hat.',
    delivery: 'Hat Box. Two players, scene happens around this box of hats [point]. Every so often grab a new hat, and your character changes to match. Need a scene location. [check players]',
  },
  {
    id: 'the_hat_game',
    name: 'The Hat Game',
    tags: ['2 players', 'Tiebreaker'],
    constraints: [],
    description: 'Get two players onstage. Give them both hats that they wear lightly on their heads. Give them a simple scene to play. A player wins the game by swiping the other player\'s hat off their head. The player loses the game if they attempt a swipe and fail.',
    delivery: 'The Hat Game. Two players, each wearing a hat - wear them light, not jammed on. Audience gives us a scene. Win by swiping the other player\'s hat off their head. But if you go for the swipe and miss, you lose. Play the scene while you maneuver. [check players]',
    notes: 'Timid players will play far away from each other, so you may have to encourage them to "put the hats in danger" by moving closer in. Discourage players from cheating by pulling the hats down low over their heads, 2000s-bucket-hat-style. A frequent strategy to win this game is to get the other player "in their head" - either emotionally into the scene, or stuck in something intellectual like a math problem - for long enough to distract them from a hat-snatch.',
  },
  {
    id: 'moving_people',
    name: 'Moving People',
    tags: ['2 players', 'Tiebreaker', 'Audience participation'],
    constraints: ['audience_on_stage'],
    description: 'Two audience members come on stage and physically pose the performers. The performers must justify whatever position they\'re placed in as the next moment of the scene. Audience moves them around as the scene continues.',
    delivery: 'Moving People. I need two audience volunteers on stage [point]. Your job is to physically move our performers - their arms, posture, where they\'re facing, whatever you want. Performers, whatever position you\'re put in, that\'s your next line of the scene - justify it. We need a scene location. [check audience: gentle moves please. check players: ready to be flung around?]',
  },
  {
    id: 'film_noir',
    name: 'Film Noir',
    tags: ['2 players', '3 players', 'Genre', 'Accent'],
    constraints: [],
    description: 'A scene played fully in the style of 1940s film noir, complete with hard-boiled internal monologue from one of the performers.',
    delivery: 'Film Noir. Black and white world. One of you has the internal monologue - rain, regret, dame walked into my office, all of it. We need an audience-suggested mystery. [check players]',
  },

  // --- Notion batch 1 ---
  {
    id: 'death_in_a_minute',
    name: 'Death in a Minute',
    tags: ['Solo scene', '2 players', 'Lightning Round'],
    constraints: [],
    description: 'Get two players (or possibly one player) on stage. Have them perform a scene, possibly with an audience suggestion, and the instruction that the scene will last one minute, and one character must be dead by the end.',
    delivery: 'Death in a Minute. One or two players up here. Audience gives us a scene. You\'ve got exactly one minute, and one of you needs to be dead by the end. Newer players will hem and haw - I may remind you how little time is left as we go. [check players]',
    notes: 'A clever player may die in far less than one minute, and leave their scene partner to vamp for the remaining time. Newer players may procrastinate; remind them how little time is left.',
    followsLong: true,
  },
  {
    id: 'emotional_zones',
    name: 'Emotional Zones',
    tags: ['2 players', '3 players', 'Zone'],
    constraints: [],
    description: 'Get three players (or possibly two) onstage. From the audience, get three very different emotions. Split the stage into three zones (left, right, center), and assign an emotion to each. When any player is in (say) the nostalgic zone, they have to continue playing the scene as if they\'re in a very nostalgic zone. Players justify the changes in mood, however flimsily.',
    delivery: 'Emotional Zones. Three players, three zones - left, center, right [point to each]. Audience gives us three very different emotions, one for each zone. Whatever zone you\'re standing in, you play in that emotion. Move into a new zone, you snap into that emotion. Justify the shifts as best you can. [check players]',
    notes: 'Clever players will find excuses to move around the space; the varsity move is to start a line in one emotion and continue it through the other two. Choose zones such that at least two have a positive vibe.',
    similarTo: ['genre_zones'],
  },
  {
    id: 'eye_contact_while_touching',
    name: 'Eye Contact While Touching',
    tags: ['2 players', 'Physical Contact'],
    constraints: ['physical_contact'],
    description: 'Get two players onstage. Give them a straightforward scene setup, with one restriction: when they are physically touching, they have to make eye contact; when they are not touching, they cannot make eye contact. (Or, if working with more experienced or up-for-anything players, reverse those two instructions.)',
    delivery: 'Eye Contact While Touching. Two players, scene with a location from the audience. The rule: when you\'re physically touching, you have to make eye contact. When you\'re not touching, you cannot make eye contact. [If reversed: when you\'re touching, no eye contact; when apart, lock eyes.] [check players: comfortable with the touching rule?]',
    notes: 'Clever players will lean against the game, saying things like "Please, just look me in the eyes and tell me you don\'t love me" without touching their partner. This requires either a hard-and-fast rule about which physical contact is permissible, and/or heavier intimacy training among the actors.',
    similarTo: ['musical_eye_contact'],
  },
  {
    id: 'genre_switch',
    name: 'Genre Switch',
    altNames: ['Genre Replay'],
    tags: ['2 players', '3 players', 'Genre', 'Replay'],
    constraints: [],
    description: 'Get three players (or possibly just two) onstage. Have them perform a roughly 1-minute scene. Then prompt the audience to suggest genres, and repeat the 1-minute scene in different genres.',
    delivery: 'Genre Switch. Two or three players. Perform a one-minute scene - audience gives us a location. After the first run we\'ll get genre suggestions from the audience, and you replay the same scene in each genre. [check players]',
    notes: 'In any "repeat a 1-minute scene" game, players should opt for clarity over nuance: big characters, obvious physical beats, and a simple storyline all work well when the game involves repeating that material with variations.',
    similarTo: ['half_life'],
  },
  {
    id: 'genre_zones',
    name: 'Genre Zones',
    tags: ['2 players', '3 players', 'Zone', 'Genre'],
    constraints: [],
    description: 'Get three players (or possibly two) onstage. From the audience, get three very different genres. Split the stage into three zones (left, right, center), and assign a genre to each. When any player is in (say) the Western zone, they have to continue playing the scene as if they\'re in a Western.',
    delivery: 'Genre Zones. Three players, three zones [point]. Audience gives us three different genres - one per zone. Whatever zone you\'re in, the scene plays in that genre. Cross into another zone, the genre changes. [check players]',
    notes: 'Clever players find excuses to move around the space; the varsity move is to start a line in one genre and continue it through the other two. Choose zones such that at least two have a potentially positive vibe.',
    similarTo: ['emotional_zones'],
  },
  {
    id: 'getting_a_2',
    name: 'Getting a 2',
    tags: ['Solo scene', '2 players'],
    constraints: [],
    description: 'Get two players onstage. Instruct them to "do a scene that gets a 2". (This can also work as a solo scene.)',
    delivery: 'Getting a 2. One or two players. Your instruction is simple: do a scene that gets a 2 out of 10. [check players]',
  },
  {
    id: 'half_life',
    name: 'Half-life',
    tags: ['2 players', '3 players', 'High Energy', 'Replay'],
    constraints: [],
    description: 'Get three players (or possibly just two) onstage. Have them perform a roughly 1-minute scene. Then repeat the scene - all the same material - but compressed into 30 seconds. Repeat again at 15 seconds, 7.5 seconds, and finally just 3 seconds.',
    delivery: 'Half-life. Two or three players. We\'ll start with a one-minute scene - audience gives a location. Then you do the same scene in 30 seconds. Then 15. Then 7.5. Then 3 seconds. Same material, compressed each time. [check players]',
    notes: 'Players should opt for clarity over nuance: big characters, obvious physical beats (especially important for half-life), and a simple storyline all work well.',
    similarTo: ['genre_switch'],
  },
  {
    id: 'he_said_she_said',
    name: 'He Said/She Said',
    altNames: ['(change pronouns as befits the players)'],
    tags: ['2 players', 'Complicated', 'Thinky'],
    constraints: [],
    description: 'Get two players onstage. One person says a line of dialog, the other person endows them with a physical action, and they perform that physical action. The pattern alternates between the two actors. If you\'re onstage, you may not perform any physical action unless it is proscribed by your scene partner.',
    delivery: 'He Said/She Said. Two players. The pattern: Player A says a line of dialog. Player B endows them with an action - "he said, putting on his coat" - and Player A performs that action. Then Player B says a line, Player A endows them with an action, Player B performs it. You can\'t do ANY physical action onstage unless your partner proscribes it. Audience gives a location. [check players: brain-breaker, ready?]',
    notes: 'This is a brain-breaking game, and the player confusion is part of the entertainment value. Clever players will deliver lines that imply clear accompanying physical actions: "I\'m gonna take my hat and walk out that door!" - giving their partner the chance to either go along ("He said, picking up his hat") or fight it for comic effect ("He said, looking around ineffectually for his hat").',
  },
  {
    id: 'hell_dub',
    name: 'Hell Dub',
    tags: ['2 players', '3 players', 'Complicated', 'Thinky'],
    constraints: [],
    description: 'Get three players (or possibly two) on-stage. Tell player #1 to "dub" a distinctive voice for player #2 (while player #2 mouths the dialog); likewise for #2 (for #3) and #3 (for #1). Given them a simple setup, and have them do a scene where they dub *all* the dialog for each other, in those voices.',
    delivery: 'Hell Dub. Three players. Each of you dubs the voice of the next player. #1 voices #2, #2 voices #3, #3 voices #1. You mouth your own words, but the dub from your assigned voicer is what the audience hears. Simple setup from the audience. [check players: announced as the hardest game in improv]',
    notes: 'Clever players will lean into the voice they receive, giving it appropriate (or inappropriately funny) physicality. Generous players use the gimmick to make their partners look good and get themselves into trouble. Massively brain-breaky - if everyone is having too easy a time, make players switch roles.',
  },
  {
    id: 'hesitation_debate',
    name: 'Hesitation Debate',
    tags: ['2 players', 'Bonus Point', 'Tiebreaker', 'Audience participation', 'Interruption'],
    constraints: [],
    description: 'Get two players onstage; place one DR and one DL. From the audience, get a minor, unimportant subject for the two to debate - pro and con for some small, innocuous subject. The players alternate giving short speeches, but at key moments, they pause, hold a hand out to the audience, and the audience provides their next word. The player has to fold that word into the speech with whatever justification they can manage.',
    delivery: 'Hesitation Debate. Two players, one stage right [point], one stage left [point]. Audience gives us a small, dumb subject - pro and con. You alternate short speeches. At key moments, pause and hold a hand out - the audience gives you your next word. Use that exact word, and justify whatever they throw at you. [check players]',
    notes: 'Try to make the player use the exact word provided. Players should build up to important nouns before throwing to the audience. You can have the audience score who "won" the debate for a tiebreaker or bonus point. Good exercise for introducing audience participation without bringing an audience member onstage.',
    similarTo: ['twin_pillars'],
  },

  // --- Notion batch 2 ---
  {
    id: 'letter_restriction',
    name: 'Letter Restriction',
    tags: ['2 players', '3 players', 'Tiebreaker', 'Bonus Point', 'Verbal Restriction'],
    constraints: ['wordplay'],
    description: 'Pick a very common letter - e.g., "S". Get two (or three) players to do a scene where they cannot use that letter. If a player uses it (say, one person says "I see it!" or "welcome to the island!"), they\'re eliminated, and find an excuse to leave the scene. The last player standing can receive a bonus point or win a tiebreaker.',
    delivery: 'Letter Restriction. Two or three players. We pick a very common letter - say S. From now on, no word with that letter can come out of your mouth. If you use it, you\'re out and you find an excuse to leave the scene. Last one standing wins a bonus point. We need a scene location. [check players]',
    notes: 'Most players will play this very safe, slowing their dialog to a crawl or going completely silent. Find ways to encourage them to keep talking and play to the limit of their ability.',
    similarTo: ['the_alphabet_game', 'verbal_restriction_tiebreakers', 'x_word_sentences'],
  },
  {
    id: 'little_voice',
    name: 'Little Voice',
    tags: ['2 players', 'Tech', 'Microphone'],
    constraints: [],
    description: 'Get two players, one onstage, the other offstage or at the edge of the stage - ideally, they\'re offstage on a mic. From the audience, get a small object you\'d find around the house (or a small animal). Have the onstage player do a solo scene and eventually encounter the object, who talks to them via a "little voice" provided by the mic\'d player.',
    delivery: 'Little Voice. One player onstage, one player on a mic off to the side. Audience gives us a small object or animal. Onstage player begins a solo scene. Eventually you encounter the object. The object talks to you - that\'s our mic\'d player providing the little voice. Let it play out. [check players]',
    notes: 'It\'s important for the onstage player to accept the reality of the small, talking thing very quickly. Fighting over whether this is a hallucination, while realistic, is not what we want from the scene. A frequent direction is to tell the "little voice" player that they want the onstage character to *do* something for them - this retroactively justifies why the object initiated the conversation, and gives the scene something to be about.',
  },
  {
    id: 'master_servant_scene',
    name: 'Master/Servant Scene',
    tags: ['2 players', '3 players'],
    constraints: [],
    description: 'Get two or three people onstage. One is the master, the others are servants. The master gives commands; the servants have to follow them.',
    delivery: 'Master/Servant Scene. Two or three players. One of you is the master, the others are your servants. Master gives orders, servants carry them out. Audience gives us a setting. [check players]',
    notes: 'The most common way to play out this scene is to have the servants begin to subvert the master; they\'ll carry out the orders, but (say) make faces at the master whenever they aren\'t looking.',
  },
  {
    id: 'more_british',
    name: 'More British',
    tags: ['2 players', '3 players', 'Accent', 'Bell'],
    constraints: [],
    description: 'Get two or three players onstage. Have them begin a scene in a normal accent. Tell them that every time you ring your bell, they need to become more British.',
    delivery: 'More British. Two or three players, scene in a normal accent. Every time I ring this bell [demonstrate], you have to become more British. We\'ll start mild and push to incomprehensible. Audience gives a scene location. [check players]',
    notes: 'Ideally, the players should go right past any round-earth accent and become so exaggeratedly British that they\'re incomprehensible. Ideally different players will each have their own take on "British" that they\'ll then lean into and exaggerate.',
  },
  {
    id: 'musical_eye_contact',
    name: 'Musical Eye Contact',
    tags: ['2 players', 'Music', 'Tech'],
    constraints: [],
    description: 'Get two players onstage. Give them a straightforward scene setup, with one restriction: when the tech/accompanist plays music, they have to make eye contact; when there is no music playing, they cannot make eye contact.',
    delivery: 'Musical Eye Contact. Two players, scene with a location from the audience. The rule: when the music plays, you have to make eye contact. When the music stops, no eye contact. Tech, you\'re driving the rule. [check players, check tech]',
    notes: 'Clever players will lean against the game, saying things like "Please, just look me in the eyes and tell me you don\'t love me" while music steadfastly does not play. Note that the musical choices have to produce steady sound - with sparse musical selections, it becomes hard to distinguish "there is a rest in the music" versus "the music stopped playing".',
    similarTo: ['eye_contact_while_touching'],
  },
  {
    id: 'nonsense_definition',
    name: 'Nonsense Definition',
    tags: ['2 players', '3 players', '4 players', 'Tiebreaker'],
    constraints: [],
    description: 'Get two to four players up and array them in a front line. Get a nonsense/gibberish word from the audience. Have each player give a definition. The audience determines the winner.',
    delivery: 'Nonsense Definition. Two to four players in a line up here. Audience gives us a nonsense word - the more invented the better. Each of you in turn gives a definition. Audience picks the winner. [check players]',
    notes: 'Linguistic-nerd players can have lots of fun with it, giving etymologies, outdated usages, and sample sentences; this is perhaps less fun for the audience, though.',
  },
  {
    id: 'omg_that_means',
    name: 'OMG That Means',
    tags: ['2 players', '3 players', 'Tech', 'Interruption'],
    constraints: [],
    description: 'Get two or three players onstage. Give them a setup that\'s either highly dramatic or highly mundane, no middle ground. With your tech, pick a dramatic tech cue (such as the "dramatic chipmunk" sound). Any time the players hear that, their next line of dialog has to start with "Oh my god. That means...", followed with the dire implications of whatever was previously said.',
    delivery: 'OMG That Means. Two or three players. Setup is either super dramatic or super mundane - audience gives us one of those. Tech will hit a dramatic sound cue at key moments. Whenever you hear it, your next line has to start with "Oh my god. That means..." and then you spin out the dire implications. [check players, check tech]',
    notes: 'This requires players to pause between lines of dialog - overlapping dialog makes it hard for tech to hop in with the noise. Clever players will lean into the premise by laying out either very impactful dialog or very mundane dialog, giving the tech either easy lay-ups for the sound, or fun moments where "It\'s Tuesday" has to have a powerful impact on the story.',
  },
  {
    id: 'one_minute_to_contact',
    name: 'One Minute to Contact',
    tags: ['2 players', 'Lightning Round'],
    constraints: [],
    description: 'Get two players. Start them off stage right and stage left. Tell them to steadily walk towards each other, and that the scene will end when they make contact.',
    delivery: 'One Minute to Contact. Two players, one stage right, one stage left [point]. You\'re going to steadily walk toward each other. The scene ends when you make contact. Audience gives us the scenario. [check players]',
  },
  {
    id: 'pun_games',
    name: 'Pun Games',
    tags: ['2 players', '3 players', '4 players', 'Tiebreaker'],
    constraints: [],
    description: 'Classic pun-based line games can serve as a tiebreaker. Put the players on a back line. Get a word from the audience. Have each player in turn deliver a pun based on that word. Audience votes on the best pun.',
    delivery: 'Pun Games. Players in a back line [point]. Audience gives us a word. Each of you in turn delivers a pun based on it. Audience picks the best pun. We can pick a format: 185 (185 nouns walk into a bar), Last Action Line (Schwarzenegger-style action movie one-liner), or CSI (detective remark on a corpse). [check players: pick a format?]',
    notes: 'Typical formats: "185 [noun]s walk into a bar. Bartender says, We don\'t serve [noun]s here. [punch line]." "Elephant": 185 elephants walk into a bar, bartender says we don\'t serve elephants here, 185 elephants say "oh, we\'ll remember this." Last Action Line: deliver a Schwarzenegger-esque line you\'d say just before killing the bad guy, punning on the word ("Pencil" → [stab] "I think he got the point."). CSI: detective remarking on a corpse at a location ("Garden" → "Looks like this guy\'s... pushing up daisies.").',
  },

  // --- NEW BATCH ---
  {
    id: 'rock_paper_scissors_anything',
    name: 'Rock Paper Scissors Anything',
    tags: ['2 players', '3 players', 'Tiebreaker'],
    constraints: [],
    description: 'Get two to three players up and array them in a front line. They will play rock, paper, scissors, but they are allowed to summon anything they like in lieu of those three objects. So long as it has a name and a hand gesture, it\'s fair game, from "a rabid wyvern" to "economic instability" to "whatever they threw, plus one". Go down the line with their offers, and have the audience determine which "anything" wins.',
    delivery: 'Rock Paper Scissors Anything. Two or three players in a front line. We\'re playing RPS, but you can throw ANYTHING - has to have a name and a hand gesture. "A rabid wyvern." "Economic instability." "Whatever they threw, plus one." Go down the line, each of you throws something, audience picks the winner. [check players]',
  },
  {
    id: 'scene_from_nothing',
    name: 'Scene from Nothing',
    tags: ['2 players'],
    constraints: [],
    description: 'Get two players onstage; have them do a "scene from nothing" - no suggestion, no setup.',
    delivery: 'Scene from Nothing. Two players. No suggestion. No setup. Take a breath, and begin. [check players]',
    notes: 'It\'s often useful to advise players to "start with thirty seconds of silence", as this can help ground themselves and pay attention to their partners. Note that this always leaves room for a canny director to *add* a game or a restriction later on - for example, if you\'re a minute in and everybody is talking too much, then force them to speak in 2- and 3-word sentences.',
    followsShort: true,
  },
  {
    id: 'scene_in_reverse',
    name: 'Scene in Reverse',
    tags: ['2 players', '3 players', '4 players', 'Complicated'],
    constraints: [],
    description: 'Get 2-4 players onstage. Have them deliver a scene in reverse: we will first hear the last line of dialog, then the previous one, then the one before that. (You can be less strict about blocking - probably good to avoid people walking backwards, for example, for safety reasons.) For an added challenge, occasionally have them reset to playing forward again, requiring them to remember all their previous lines.',
    delivery: 'Scene in Reverse. Two to four players. We play the scene in reverse - last line first, then the line before, then the line before that. Don\'t worry too much about blocking - no walking backwards. Audience gives us a final line to start from. [check players] If I call "forward" you reset and play forward, remembering everything you\'ve said.',
    notes: 'This is a challenging game, and the typical confusion and difficulty add to the entertainment value. If they\'re going forward, you may need to remind players of previously-delivered lines.',
    similarTo: ['backwards_scene'],
  },
  {
    id: 'scene_without',
    name: 'Scene Without',
    tags: ['2 players', '3 players', '4 players', 'Genre', 'Narrative'],
    constraints: [],
    description: 'Get 2-4 players onstage. Pick a well-worn genre like "western" or "film noir". From the audience, get three things that are absolute go-tos for that genre - for "film noir," you might get "a detective", "voiceover", and "a femme fatale". Then, challenge the players to perform a scene that is absolutely clearly in-genre, but includes none of the provided elements.',
    delivery: 'Scene Without. Two to four players. Audience gives us a well-worn genre - western, film noir, romcom. Then three things that ALWAYS appear in that genre. Your job: play a scene that is unmistakably in that genre, but uses NONE of those three things. [check players]',
    notes: 'This is a rather advanced game; at its best, it inspires the players to make unique, evocative, "deep cut" choices from the chosen genre, and often creates a very traditional-feeling scene with stronger emotional resonance, because the players can\'t lean into clichés for a laugh of recognition.',
  },
  {
    id: 'that_sounds_like_a_song',
    name: 'That Sounds Like a Song!',
    tags: ['2 players', '3 players', 'Music', 'Singing'],
    constraints: ['singing'],
    description: 'Get two or three players onstage. Give them a simple scene setup. At some point, when you hear an evocative line of dialog, cue the actors with "that sounds like a song!" When the player who just spoke hears this, they must improvise a (very short) song with the last line of dialog as the title. (A variation is "That Reminds Me of a Song!", where the players are all old cabaret singers; frequently dialog reminds one of them of one of their old classic numbers, so they sing a few bars.)',
    delivery: 'That Sounds Like a Song! Two or three players, scene with a location from the audience. Whenever I hear an evocative line, I\'ll call out "that sounds like a song!" - and you, the player who just spoke, has to improvise a short song with that line as the title. [check players, check tech] Variation: That Reminds Me of a Song! where you\'re all old cabaret singers and dialog reminds you of your old classic numbers.',
    notes: 'A confident/reckless director can throw the job of shouting "that sounds like a song!" to the audience.',
  },
  {
    id: 'twin_pillars',
    name: 'Twin Pillars',
    tags: ['2 players', 'Audience participation', 'Interruption'],
    constraints: ['audience_on_stage'],
    description: 'Get two players and two audience volunteers onstage. Assign each volunteer to a player; place the volunteers DL and DR. Give the players a simple setup. Occasionally the players will pause their dialog and make a gesture to their volunteer. (In the past the player would touch the volunteer; this is no longer recommended.) The volunteer then provides the next word for the player to use; the player immediately uses that in their dialog, continuing the scene.',
    delivery: 'Twin Pillars. Two players, two audience volunteers - one for each player. Volunteers stand DL and DR [point]. Players run a scene from an audience suggestion. When you pause and gesture to your volunteer, they give you your next word - use it exactly, justify whatever they say. [check audience volunteers: clear? check players]',
    notes: 'Try to make the player use the exact word provided: if the volunteer says "cat", the next thing they say should be "cat", not "here\'s the thing about these so-called cats". Players should try to create evocative opportunities for the volunteer - e.g., building up to an important noun in the sentence - before throwing to them.',
    similarTo: ['hesitation_debate'],
  },
  {
    id: 'verbal_restriction_tiebreakers',
    name: 'Verbal Restriction Tiebreakers',
    tags: ['2 players', 'Tiebreaker', 'Verbal Restriction'],
    constraints: ['wordplay'],
    description: 'Many verbal restriction setups - don\'t use "the", don\'t use the letter "s", that sort of thing - work well as tiebreakers. Whoever breaks the restriction first loses the tiebreaker.',
    delivery: 'Verbal Restriction Tiebreaker. Two players. We pick a restriction - don\'t use "the", don\'t use the letter "s", whatever fits. Whoever breaks the restriction first loses. Audience gives us a scene to play. [check players]',
    notes: 'Players tend to play verbal restriction very safe, slowing their dialog to a crawl or going completely silent. Find ways to encourage them to keep talking and play to the limit of their ability.',
    similarTo: ['letter_restriction', 'the_alphabet_game'],
  },
  {
    id: 'who_is_more_x',
    name: 'Who Is More <x>?',
    tags: ['2 players', '3 players', 'Bonus Point', 'Tiebreaker'],
    constraints: [],
    description: 'Get two or three players onstage. Have them perform a straightforward scene. Award a bonus point based on who can best embody some quality. Possibilities: high/low status, generous/selfish, able to make the other characters look good, happy/sad, courageous/timid, heroic/villainous.',
    delivery: 'Who Is More [quality]? Two or three players. We pick a quality - high status, generous, courageous, whatever fits. Run a scene from an audience suggestion. Bonus point goes to whoever best embodies the quality. [check players]',
    notes: 'Generally you\'ll want to use positive emotions/goals here; competing to be the worst person often brings out players being genuinely mean to each other, which alienates the audience.',
  },
  {
    id: 'x_word_sentences',
    name: 'x-Word Sentences',
    tags: ['2 players', '3 players', 'Verbal Restriction'],
    constraints: ['wordplay'],
    description: 'Get three players (or possibly just two) onstage. For each player, get a number between 1 and 10. Each player is then limited to lines of dialog with that number of words.',
    delivery: 'x-Word Sentences. Two or three players. We get a number from the audience for each of you, 1 to 10. Each line of dialog you say has to have exactly that many words. Audience gives us a location. [check players]',
    notes: 'There are fun mechanics to vary the number of words between players; one possibility is to start with "a number between 1 and 10"; say they pick 4. Then you remove 4 from the "pool" and prompt for "a number between 1 and 5". Finally the third player gets whatever is left. Keep the players honest, if you can; players have a tendency to unconsciously cheat in this game, and part of the fun is watching them get (say) three words into a half-finished sentence and then realize they have to stop short.',
    similarTo: ['the_alphabet_game', 'letter_restriction'],
  },
  {
    id: 'zoom_in_zoom_out',
    name: 'Zoom In, Zoom Out',
    tags: ['2 players', '3 players', 'Physical'],
    constraints: [],
    description: 'Get two (or possibly three) players onstage. Give them a scene setup that should lead to a lot of action, like they\'re escaping a forest fire. Provide a piece of furniture, like a chair, that can act like a miniature "puppet stage" and put it DC. The scene starts normally. But then, whenever you say "zoom out!", the players continue the scene as little finger-puppets on the miniature stage. When you cue them with "zoom in!", the scene continues at "normal size".',
    delivery: 'Zoom In, Zoom Out. Two or three players. Setup should be action-heavy - audience gives us a scene with lots of stakes. We\'ve got our miniature stage here [point to chair]. Normally you play at full size. When I call "zoom out", you become little finger-puppets on the miniature stage. When I call "zoom in", back to full size. [check players]',
    notes: 'Clever players will use the "zoom out" sections to do crazy action sequences that aren\'t possible onstage. Clever directors will cue with "zoom in" at moments that might be physically awkward to recreate onstage.',
  },

  // --- From sample Maestro running order ---
  {
    id: 'opening_monolog_one_breath',
    name: 'Opening Monolog in One Breath',
    tags: ['5+ players', 'Bonus Point', 'Lightning Round'],
    constraints: [],
    description: 'All-play opening round. Each player delivers a monolog in a single breath - whoever can sustain the longest interesting content wins a bonus point.',
    delivery: 'Opening Monolog in One Breath. Everyone gets a turn. One deep breath - go. You speak until you run out of air. Bonus point for the most interesting monolog. [check players]',
    notes: 'Maestro opening all-play. Bonus point for most interesting monolog.',
  },
  {
    id: 'four_square',
    name: 'Four Square',
    altNames: ['Pan Left/Pan Right'],
    tags: ['4 players', 'Complicated'],
    constraints: [],
    description: 'Four players in a square formation (two front, two back). Director calls "Pan Left" or "Pan Right" to rotate the square, shifting which pair the audience is watching. Four interlocking stories play out, each picking up where they left off when the camera returns.',
    delivery: 'Four Square, also called Pan Left/Pan Right. Two players here and here [point front], two directly behind them here and here [point back]. We follow different pairs as I call Pan Left [gesture] or Pan Right [gesture], rotating the square. When I rotate away from your story, you freeze. When I rotate back, you pick up exactly where you left off. [check players]',
    notes: 'From the sample Maestro running order. Strong opening Round 1 game.',
    similarTo: ['parallel_universe'],
  },
  {
    id: 'parallel_universe',
    name: 'Parallel Universe',
    altNames: ['Alternate Universe'],
    tags: ['4 players', 'Complicated'],
    constraints: [],
    description: 'Two pairs of performers play the same scene in two parallel universes. Director switches focus between the universes, and each pair must justify what happens in the other universe affecting theirs.',
    delivery: 'Parallel Universe. Two pairs of performers, two scenes happening in parallel universes. I\'ll switch between them - when I switch to your universe, you\'re playing the scene in your version of reality. Audience gives us a starting scene. [check players]',
    notes: 'Placeholder description - fill in from Wayward house rules.',
    similarTo: ['four_square'],
  },
  {
    id: 'entrances_and_exits',
    name: 'Entrances and Exits',
    tags: ['3 players', 'Complicated'],
    constraints: [],
    description: 'Each player is assigned a secret rule about when they must enter or exit the stage (e.g., enter whenever someone says a colour, exit when someone mentions food). They play a scene while obeying their rule.',
    delivery: 'Entrances and Exits. Three players. Each of you gets a secret rule about when you have to enter or exit the stage. We\'ll get those quietly. Then we run a scene - you obey your rule throughout. Audience gives a location. [check players]',
    notes: 'From the sample Maestro running order, Round 1.',
  },
  {
    id: 'good_bad_worst_advice',
    name: 'Good Bad Worst Advice',
    tags: ['4 players', 'Bonus Point'],
    constraints: [],
    description: 'One player asks for advice on an audience-suggested problem. Three other players give good advice, bad advice, and the worst possible advice in turn. Audience scores who gave the best worst advice.',
    delivery: 'Good Bad Worst Advice. One player asks for advice - audience gives the problem. Three players give advice: one good, one bad, one worst-possible. Audience picks the winner of the worst advice category. [check players]',
    notes: 'From the sample Maestro running order, Round 2.',
  },
  {
    id: 'making_faces',
    name: 'Making Faces',
    tags: ['2 players'],
    constraints: [],
    description: 'Two players run a scene. At key moments, one or both must make exaggerated facial expressions tied to what their character is feeling. Director may call out specific faces to make.',
    delivery: 'Making Faces. Two players, scene with a location from the audience. At key moments I may call for a specific face - rage, disgust, ecstasy - and you have to hit it big and hold it briefly before continuing the scene. [check players]',
    notes: 'From the sample Maestro running order, Round 2. Fill in exact rules from Wayward notes.',
  },
  {
    id: 'instant_soap_opera',
    name: 'Instant Soap Opera',
    tags: ['3 players', 'Genre', 'High Energy'],
    constraints: [],
    description: 'A scene played in the style of a soap opera, with dramatic reveals, melodramatic acting, and over-the-top stakes. Director may call for sting moments (dramatic music cues).',
    delivery: 'Instant Soap Opera. Three players. Audience gives a melodramatic premise - someone\'s pregnant, someone\'s lying about their identity, somebody\'s evil twin. Play it for maximum melodrama, dramatic reveals, hold every reaction. [check players]',
    notes: 'From the sample Maestro running order, Round 3.',
  },
  {
    id: 'scene_setup',
    name: 'Scene Setup',
    tags: ['2 players'],
    constraints: [],
    description: 'A straightforward two-player scene built from a single audience suggestion. The default Maestro form.',
    delivery: 'Scene Setup. Two players, one suggestion from the audience. Build a scene. [check players]',
    notes: 'From the sample Maestro running order, Round 4. Default form.',
  },
  {
    id: 'slow_lie',
    name: 'Slow Lie',
    tags: ['Solo scene'],
    constraints: [],
    description: 'One player tells a slow, escalating lie as a monolog. Each beat raises the absurdity of the lie further than the last, but the player must maintain a believable, deadpan delivery.',
    delivery: 'Slow Lie. One player. Audience gives you a small premise - something you "did" recently. You tell the story, slowly escalating the lies, but everything has to feel like you absolutely believe it. [check player]',
    notes: 'From the sample Maestro running order, Round 4. Solo scene.',
  },
  {
    id: 'genre_setup',
    name: 'Genre Setup',
    tags: ['2 players', 'Genre'],
    constraints: [],
    description: 'A two-player scene played fully in an audience-suggested genre from start to finish.',
    delivery: 'Genre Setup. Two players. Audience gives us a genre. Play the whole scene in that genre. [check players]',
    notes: 'From the sample Maestro running order, Round 4.',
  },
  {
    id: 'villain_speech',
    name: 'Villain Speech',
    tags: ['Solo scene', 'Genre'],
    constraints: [],
    description: 'One player delivers a villain monolog - the kind a Bond villain gives to a captured hero. Audience supplies the evil plot.',
    delivery: 'Villain Speech. One player. Audience gives us your evil plot. Deliver the speech to your captured nemesis. The kind of speech where you reveal too much because you assume you\'ve already won. [check player]',
    notes: 'From the sample Maestro running order, Round 5. Solo.',
  },
  {
    id: 'demon_voice',
    name: 'Demon Voice',
    tags: ['Solo scene'],
    constraints: [],
    description: 'One player performs a scene or monolog while voicing their own internal demon - a guttural, otherworldly voice they switch into at intervals.',
    delivery: 'Demon Voice. One player. Audience gives a scenario. At intervals - I may call them, or it may be organic - you drop into your demon voice and the demon speaks. Then back to you. [check player]',
    notes: 'From the sample Maestro running order, Round 5. Solo.',
  },
  {
    id: 'recap_show_one_minute',
    name: 'Recap the Whole Show in 1 Minute',
    tags: ['Solo scene', 'High Energy', 'Lightning Round'],
    constraints: [],
    description: 'One player recaps everything that happened in the show so far, compressed into one minute. Usually the closer of a Maestro finale.',
    delivery: 'Recap the Whole Show in One Minute. One player. You\'ve got sixty seconds to tell the audience everything that happened tonight. Big strokes, references back to highlights, go. [check player]',
    notes: 'From the sample Maestro running order, Round 5 closer.',
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    tags: ['2 players', '3 players', 'Narrative'],
    constraints: [],
    description: 'One player is the author, narrating a story aloud as if typing it. The other players act out whatever is narrated, including dialogue the author assigns them.',
    delivery: 'Typewriter. One player is the author - you narrate the story aloud as you write it. The others act out everything you say. If you write dialog for them, they say it. Audience gives us a story prompt. [check players]',
    notes: 'Placeholder description - fill in from Wayward house rules. Good follow-on when the previous scene felt very short.',
    followsShort: true,
  },

  // --- 3-PLAYER ---
  {
    id: 'expert_translation',
    name: 'Expert Translation',
    tags: ['3 players', 'Audience participation', 'Bonus Point'],
    constraints: ['gibberish_only'],
    description: 'An expert speaks only in gibberish about their (audience-suggested) area of expertise. A translator translates the gibberish into English. An interviewer asks them questions.',
    delivery: 'Expert Translation. Three roles: the expert who speaks only gibberish, the translator who renders it in English, and the interviewer. We need a field of expertise from the audience - the weirder the better. Expert: full commitment to gibberish, no English. Translator: you decide what they meant. [check players]',
  },
  {
    id: 'quick_change',
    name: 'Quick Change',
    tags: ['3 players', 'Audience participation', 'Complicated'],
    constraints: [],
    description: 'Performers play a scene and must work in lines of dialogue from slips of paper provided by the audience. They pull a slip and must use that exact line as their next piece of dialogue, justifying it within the scene.',
    delivery: 'This is Quick Change. Before the scene, audience writes lines on slips of paper - we\'ve got them here. Three performers in the scene. When I tap your shoulder, you pull a slip and that\'s your next line, exactly as written. Your job is to make it fit. [check players]',
  },
  {
    id: 'improbable_mission',
    name: 'Improbable Mission',
    tags: ['3 players', 'High Energy', 'Genre'],
    constraints: [],
    description: 'A spy-movie briefing. A briefing officer gives two agents an absurd mission with a series of even more absurd obstacles. The agents then must mime carrying out the mission.',
    delivery: 'Improbable Mission. One briefing officer, two agents. Briefing officer, you give the agents their mission and outline a series of obstacles they\'ll face - the wilder the better. Then the two agents physically mime carrying it out. We need an audience-suggested mission objective. [check players]',
  },
  {
    id: 'action_replay',
    name: 'Action Replay',
    tags: ['3 players', 'Genre', 'Replay'],
    constraints: [],
    description: 'Two performers play a scene. A third performer (or the director) calls "replay" and announces a different style or genre. The scene then replays in that style. Can repeat several times.',
    delivery: 'Action Replay. Two performers in a scene, scene runs about a minute. Then I\'ll call replay and give you a new style - film noir, soap opera, whatever - and you redo the same scene in that style. We\'ll do that two or three times. Need a starting scene location. [check players]',
  },
  {
    id: 'film_tv_theater_styles',
    name: 'Film, TV and Theater Styles',
    tags: ['3 players', '4 players', 'Genre'],
    constraints: [],
    description: 'Performers begin a scene. The director calls out different film, TV, or theater styles - Tarantino, Bollywood, soap opera, Shakespeare, silent film, and so on. The performers immediately shift the scene into that style.',
    delivery: 'Film, TV and Theater Styles. Performers start a scene - we\'ll get a setting. As you go I\'ll call out styles - Tarantino, Bollywood, Shakespeare, infomercial, whatever - and you instantly shift the scene to that style without losing the thread of what was happening. [check players]',
  },
  {
    id: 'film_trailer',
    name: 'Film Trailer',
    tags: ['3 players', '4 players', 'Genre', 'High Energy'],
    constraints: [],
    description: 'The cast pitches a fake movie trailer for an audience-suggested title, complete with dramatic narration, scene snippets, and the obligatory cast roll.',
    delivery: 'Film Trailer. Audience suggests a movie title that doesn\'t exist. The cast builds a trailer - we need a narrator voice, snippets of scenes, dramatic music cues we can call, the works. [check players]',
  },
  {
    id: 'early_tv',
    name: 'Early TV',
    tags: ['3 players', '4 players', 'Genre'],
    constraints: [],
    description: 'A scene played in the style of black-and-white 1950s television. Stilted acting, exaggerated reactions, period sponsor breaks.',
    delivery: 'Early TV. We\'re in the 1950s, black and white, sponsored by [audience product]. Big takes, big reactions, period delivery. Audience suggests a domestic situation. [check players]',
  },
  {
    id: 'dragons_lair',
    name: 'Dragon\'s Lair',
    tags: ['3 players', 'Genre', 'High Energy', 'Complicated'],
    constraints: [],
    description: 'A scene played as if the characters are stuck in a clunky 1980s video game. Jerky movements, looping animations, lives lost, restart from checkpoint.',
    delivery: 'Dragon\'s Lair. You\'re inside an old 80s video game. Movement is jerky, animations loop, you can die and respawn. I\'ll be calling out actions you have to perform like a controller. Audience gives us a quest. [check players]',
  },
  {
    id: 'two_line_vocabulary',
    name: 'Two-Line Vocabulary',
    tags: ['3 players', 'Audience participation'],
    constraints: [],
    description: 'One performer is restricted to only two specific phrases for the entire scene, which can mean anything depending on delivery. The other performers play normally.',
    delivery: 'Two-Line Vocabulary. One performer can only say two phrases the whole scene - we\'ll get those from the audience. The others play normally. The fun is in the meaning shifting based on delivery. [check players]',
  },
  {
    id: 'backwards_scene',
    name: 'Backwards Scene',
    tags: ['3 players', 'Complicated'],
    constraints: [],
    description: 'A scene is played from end to beginning. The performers must end at a logical setup point.',
    delivery: 'Backwards Scene. We start at the end of the scene and work backwards to the beginning. Audience gives us a final line or a final image. You\'ll need to think about what happened just BEFORE the moment you\'re in. [check players]',
    similarTo: ['scene_in_reverse'],
  },
  {
    id: 'forward_rewind',
    name: 'Forward Rewind',
    tags: ['3 players', 'High Energy', 'Complicated', 'Replay'],
    constraints: [],
    description: 'A scene plays forward normally. When the director calls "rewind," the performers physically and verbally reverse their actions back to a previous moment. When "play" is called, they continue forward, often into a new branch.',
    delivery: 'Forward Rewind. Scene plays normally. When I call rewind, you physically reverse - movements, words, everything - back to where I call play. Then go forward from there, often into a different choice. [check players]',
  },
  {
    id: 'changing_emotions',
    name: 'Changing Emotions',
    tags: ['3 players', '4 players', 'High Energy', 'Interruption'],
    constraints: [],
    description: 'A scene plays. The director periodically calls out a new emotion that all performers must immediately shift into without breaking the scene.',
    delivery: 'Changing Emotions. Scene runs, I call emotions - rage, joy, terror, lust, boredom - and you all snap into that emotion instantly without losing the scene. Audience gives a scene location and a starting emotion. [check players]',
  },

  // --- 4-PLAYER ---
  {
    id: 'film_dub',
    name: 'Film Dub',
    tags: ['4 players', 'Genre'],
    constraints: [],
    description: 'Two performers mime a scene silently while two other performers voice all their dialogue from offstage.',
    delivery: 'Film Dub. Two performers up here moving their mouths but making no sound [point]. Two of us off to the side will voice every word you say. We need a movie genre from the audience. [check players] You move your mouth, we provide the dialogue. Try to match what we give you.',
  },
  {
    id: 'foreign_film_dub',
    name: 'Foreign Film Dub',
    tags: ['4 players', 'Accent', 'Genre'],
    constraints: ['gibberish_only'],
    description: 'Two performers act out a scene speaking only in gibberish (a fictional foreign language), while two other performers translate their gibberish into English for the audience.',
    delivery: 'Foreign Film Dub. Our two stars here speak only in a made-up foreign language - total gibberish, full commitment. Our two translators here render every line into English so the audience can follow. We need a country and a movie premise. [check players]',
  },
  {
    id: 'lets_make_a_date',
    name: 'Let\'s Make A Date',
    tags: ['4 players', 'Bonus Point', 'Audience participation'],
    constraints: ['guessing'],
    description: 'A dating show parody. One performer (the bachelor or bachelorette) leaves the room. The audience assigns each of three other performers a strange quirk or identity. The bachelor returns and asks them questions, then guesses who they are at the end.',
    delivery: 'Let\'s Make A Date. We\'ll send one performer out of earshot. The other three will each get a strange quirk or character - we\'ll get those from prompts I have here / from the audience. Bachelor comes back, asks questions in dating-show style, and at the end has to guess each one\'s quirk. [check players going out]',
  },
  {
    id: 'dubbing',
    name: 'Dubbing',
    tags: ['4 players', 'Audience participation', 'High Energy'],
    constraints: ['audience_on_stage'],
    description: 'Two audience members sit on stage and mouth dialogue silently. Two performers stand or kneel behind them and voice the audience members as the scene unfolds.',
    delivery: 'Dubbing. I need two volunteers from the audience up here [point to chairs]. You will be the stars of this scene - you move your mouths, you react, you can move your bodies, but no sound. Our two performers behind you will be your voices. We need a scene to start. [check audience volunteers: comfortable? clear?]',
  },
  {
    id: 'party_quirks',
    name: 'Party Quirks',
    tags: ['4 players', 'Bonus Point', 'High Energy'],
    constraints: ['guessing'],
    description: 'One performer is the host of a party. Three guests arrive one at a time, each with a secret quirk or identity assigned by the host or audience. The host must guess all three quirks by the end of the scene.',
    delivery: 'Party Quirks. One host, three guests. Host stays here setting up the party. The three guests each get a strange quirk - I\'ll hand these out [or get from audience]. Guests arrive one at a time and commit fully to your quirk. Host, your job is to figure out who each of them is. [check host: ready? check guests: got your quirks?]',
  },
  {
    id: 'weird_newscasters',
    name: 'Weird Newscasters',
    tags: ['4 players', 'Bonus Point'],
    constraints: ['guessing'],
    description: 'A news broadcast. The anchor reads the news normally. The co-anchor, sports reporter, and weather reporter each have a secret quirk or character. The anchor often tries to guess the quirks at the end.',
    delivery: 'Weird Newscasters. Four spots: anchor, co-anchor, sports, weather. Anchor, you play it straight - read the news. The other three each get a quirk or character. We\'ll do the news with weather, sports, and your co-anchor each in your weird mode. [check players]',
  },
  {
    id: 'daytime_talk_show',
    name: 'Daytime Talk Show',
    tags: ['4 players', 'Bonus Point', 'Genre'],
    constraints: ['guessing'],
    description: 'A talk show host interviews three guests, each of whom has a strange secret quirk, condition, or identity. The host can guess at the end or play it forward.',
    delivery: 'Daytime Talk Show. One host, three guests. Each guest has a quirk we\'ll assign. Host runs the show - intro, interviews, segments - and the comedy comes from the guests committing to their thing. [check players]',
  },
  {
    id: 'authors',
    name: 'Authors',
    tags: ['4 players', 'Audience participation', 'Complicated', 'Narrative'],
    constraints: [],
    description: 'Each performer narrates a scene in the style of a different audience-suggested author. The other performers act out what is narrated. Tag through all four narrators.',
    delivery: 'Authors. We need four authors from the audience [collect]. Each of you gets one. When I tap your shoulder you narrate the next bit of the scene in your author\'s style - the others act out what you\'re saying. We rotate through. [check players: got your author?]',
  },
  {
    id: 'film_review',
    name: 'Film Review',
    tags: ['4 players', 'Genre'],
    constraints: [],
    description: 'Two critics review a fictional film. Other performers act out clips from the film as the critics describe them. Audience suggests the film\'s genre or title.',
    delivery: 'Film Review. Two critics here [point], two clip-actors here. Audience gives us a fake film title and genre. Critics describe scenes, our actors show us those scenes briefly, then back to the critics. [check players]',
  },
  {
    id: 'dead_bodies',
    name: 'Dead Bodies',
    tags: ['4 players', 'High Energy', 'Complicated'],
    constraints: [],
    description: 'Two performers play a scene that ends with both of them frozen in dramatic positions. Two new performers enter and must start an unrelated scene that justifies the existing frozen positions as their opening moment.',
    delivery: 'Dead Bodies. Two performers do a scene that ends in a dramatic freeze - I\'ll call freeze. New pair comes in, takes those exact positions, and starts a totally unrelated scene that justifies the pose as their opening moment. We can cycle this. Audience suggests a starting scene. [check players]',
    similarTo: ['frozen_inheritance'],
  },
  {
    id: 'frozen_inheritance',
    name: 'Frozen Inheritance',
    tags: ['4 players', '5+ players', 'High Energy', 'Complicated'],
    constraints: [],
    description: 'Nancy\'s pitch. A scene plays out at full energy. Director calls freeze at a high-physicality moment. The active performers tag out. New performers enter, take the exact physical positions of the frozen scene, and must launch into an entirely unrelated scene that justifies those positions as its opening moment.',
    delivery: 'Frozen Inheritance. First pair plays a scene with lots of physicality - we want big positions. I call freeze. You tag out. New pair takes the EXACT frozen positions and starts a completely unrelated scene from those positions. The frozen pose is now the opening moment of a brand new story. Audience suggests the first scene. [check players]',
    similarTo: ['dead_bodies'],
  },
  {
    id: 'change_of_cast',
    name: 'Change of Cast',
    tags: ['4 players', '5+ players'],
    constraints: [],
    description: 'A scene starts with two performers. At intervals, the director taps in replacement performers who continue the scene as the same characters without breaking continuity.',
    delivery: 'Change of Cast. Two performers start a scene. As we go I\'ll tap in replacements - you take over as the same character, same plot, no reset. Scene continues. Audience gives a starting situation. [check players]',
  },
  {
    id: 'hollywood_director',
    name: 'Hollywood Director',
    tags: ['4 players', 'Genre', 'Replay'],
    constraints: [],
    description: 'One performer plays a director on set giving notes to the others. The scene runs, the director calls cut, gives a note (play it sadder, more romantic, as if you\'re drunk), and the scene replays with that note.',
    delivery: 'Hollywood Director. One of you is the director on set - the other three are your actors. Run a scene, call cut whenever you want, give notes, and we run it again. Audience suggests the film. [check players]',
  },
  {
    id: 'living_scenery',
    name: 'Living Scenery',
    tags: ['4 players', 'High Energy', 'Physical'],
    constraints: [],
    description: 'Two performers play a scene. The other two performers become every object, animal, and prop the scene requires using their bodies.',
    delivery: 'Living Scenery. Two of you in the scene. The other two are EVERYTHING ELSE - doors, animals, chairs, weather - using your bodies. If they call for a horse, you\'re a horse. Audience gives a scene location. [check players]',
  },
  {
    id: 'csi_scene',
    name: 'CSI Scene',
    tags: ['4 players', 'Bonus Point', 'Audience participation', 'Genre', 'Complicated'],
    constraints: ['guessing'],
    description: 'Adam\'s pitch. One performer is the investigator and leaves the room. The audience supplies a crime, a murder weapon, and a motive. The remaining performers act out the crime scene cryptically without naming any of the three. The investigator returns, watches, asks questions, and must guess all three.',
    delivery: 'CSI Scene. One of you is the investigator - step out of earshot. [Get audience suggestions: crime, weapon, motive. Brief the others quietly.] Investigator comes back. The others act out a crime scene - witnesses, suspects, dramatic flashbacks - without ever naming the crime, weapon, or motive. Investigator asks questions and guesses all three at the end. [check investigator: clear? check others: got your three?]',
  },
  {
    id: 'dream_scene',
    name: 'Dream Scene',
    tags: ['4 players', 'High Energy', 'Audience participation'],
    constraints: [],
    description: 'Bruce\'s pitch. One performer narrates a dream they had - real or improvised. The other performers embody the dream as it is told, with the narrator able to change dream-logic mid-stream.',
    delivery: 'Dream Scene. One narrator - you\'re telling us about a dream you had. The others embody the dream as you tell it. You can change anything at any time - "and then suddenly we were underwater," "and the bartender turned into my mother." Whatever you say, the others become. We need an audience-suggested mundane location to start the dream. [check players]',
  },

  // --- 5+ PLAYERS / TIEBREAKERS ---
  {
    id: 'story',
    name: 'Story',
    tags: ['4 players', '5+ players', 'High Energy', 'Tiebreaker', 'Interruption', 'Narrative'],
    constraints: ['rapid_speech'],
    description: 'The director conducts the cast through a continuous story, pointing at whoever should speak next. Anyone who hesitates, breaks grammar, or fails to pick up cleanly mid-sentence is buzzed out.',
    delivery: 'Story. We\'re telling one continuous story. I point at you, you talk. I point at someone else, they pick up exactly where you left off - even mid-word. Hesitate, repeat, or break the story and you\'re out. Audience gives us a story title. [check players]',
  },
  {
    id: 'scenes_from_a_hat',
    name: 'Scenes From A Hat',
    tags: ['3 players', '4 players', '5+ players', 'Tiebreaker', 'Audience participation', 'High Energy', 'Lightning Round'],
    constraints: ['rapid_speech'],
    description: 'Audience writes scene prompts before the show and they go in a hat. Director pulls prompts one at a time. Cast tags out short bits or one-liners for each prompt.',
    delivery: 'Scenes From A Hat. Before the show the audience wrote prompts on slips and they\'re in here [point to hat]. I read one, anyone in the cast can step out and do a quick bit on it, then we move to the next. Keep them short - hit and run. [check players]',
  },
  {
    id: 'props',
    name: 'Props',
    tags: ['4 players', 'Tiebreaker', 'High Energy', 'Lightning Round'],
    constraints: [],
    description: 'Teams (usually pairs) are handed strange foam or fabric props. They take turns demonstrating what each prop could be in a quick gag format.',
    delivery: 'Props. We split into two teams of two. Each team gets a weird prop [hand them out]. Take turns showing us what your prop could be - quick gag, audience reacts, swap. We\'ll go for about a minute per prop. [check players]',
  },

  // --- LATE-ROUND SOLO AND 2-PLAYER ---
  {
    id: 'one_word_story',
    name: 'One-Word Story',
    tags: ['2 players', 'Tiebreaker', 'Lightning Round', 'Verbal Restriction'],
    constraints: ['rapid_speech', 'wordplay'],
    description: 'Two players tell a single story together, alternating one word at a time. The first player to hesitate, repeat a word inappropriately, or break grammar is out. Often run tournament-style as a tiebreaker.',
    delivery: 'One-Word Story. Two players. You\'re telling one continuous story together, but each of you only gets one word at a time. I\'ll get a story title from the audience. Hesitate, break grammar, or fumble the next word and you\'re out. Last one standing wins. [check players]',
    notes: 'Players should aim for clean sentence structure. The temptation is to set each other up with cliffhanger words like "the" or "a" - that\'s fine, but watch for repetitive patterns. If they get stuck on one sentence, prompt them to wrap it up. For tiebreakers, set a target like "first to fumble loses" or "play to ten clean sentences."',
    similarTo: ['story'],
  },
  {
    id: 'three_headed_broadway_star',
    name: 'Three-Headed Broadway Star',
    tags: ['3 players', 'Music', 'Singing', 'Tech', 'High Energy'],
    constraints: ['singing'],
    description: 'Three players stand shoulder-to-shoulder as a single "three-headed" singer. They sing a Broadway-style number together, but each player only contributes one word at a time, going down the line. The accompanist drives the melody and tempo.',
    delivery: 'Three-Headed Broadway Star. Three players, line up shoulder to shoulder [point]. You\'re a single three-headed Broadway star. You\'re going to sing a song, but each of you only gets one word at a time, going down the line - first head, second head, third head, back to first, and so on. Tech, you\'re driving the music. Audience gives us a song title that doesn\'t exist. [check players, check tech]',
    notes: 'The brain-breaking part is committing to a melody when each player only contributes one word. Players should listen for the rhythm and pick up the next word at the right musical beat. Avoid letting players signal each other with eye contact - that defeats the gag. Strong choice for Round 2 or 3 if you have musical players.',
    similarTo: ['greatest_hits'],
  },
  {
    id: 'forward_reverse',
    name: 'Forward / Reverse',
    tags: ['2 players', '3 players', 'Complicated', 'Replay'],
    constraints: [],
    description: 'A more controlled version of Forward Rewind. Players run a scene normally. When the director calls "Reverse," players reverse their actions and dialog back to a previous moment. When the director calls "Forward," they pick up from that earlier moment and play forward, often into a different branch.',
    delivery: 'Forward / Reverse. Two or three players, scene from an audience suggestion. Run it forward. When I call "Reverse," you reverse - physically and verbally - back to where I call "Forward." Then play forward again, usually into a different choice. The control is mine. [check players]',
    notes: 'Unlike Forward Rewind, the director here drives the rewind/forward calls deliberately, often to explore alternate branches of the same moment. Cue "Reverse" at meaningful decision points - a refused offer, a missed beat - to give the players a do-over. Players should commit to the new branch rather than parroting the old one.',
    similarTo: ['forward_rewind', 'scene_in_reverse', 'backwards_scene'],
  },
  {
    id: 'last_word_first_word',
    name: 'Last Word, First Word',
    tags: ['2 players', '3 players', 'Verbal Restriction', 'Thinky'],
    constraints: ['wordplay'],
    description: 'Players run a scene where each new line of dialog must start with the last word of the previous line. The constraint forces interesting verbal hooks and unexpected scene direction.',
    delivery: 'Last Word, First Word. Two or three players. Each new line of dialog has to start with the last word of the previous line. So if I end with "I\'m going to the store", the next person starts with "Store..." and goes from there. Audience gives us a scene location. [check players]',
    notes: 'Encourage players to lean into the constraint rather than fight it - the surprising hook words ("store... stores are the best place to find love") drive the scene in unexpected directions. Players who try to end every line with "the" or "a" should be coached toward more meaty closing words. Works as a Round 3 or 4 challenge.',
  },
  {
    id: 'should_have_said',
    name: 'Should Have Said',
    tags: ['2 players', '3 players', 'Interruption', 'High Energy'],
    constraints: [],
    description: 'Players run a scene. At any point the director calls "Should have said!" and the player who just spoke must immediately replace their last line with a brand new one. The director can call it as many times as they want on a single line until the player lands on something the director likes.',
    delivery: 'Should Have Said. Two or three players, scene with a location from the audience. Run a scene normally. Whenever I call "Should have said!", the person who just spoke replaces their last line with a new one. I can call it as many times as I want on the same line. Whatever you land on, the scene picks up from there. [check players]',
    notes: 'Strong Round 4 or 5 challenge. Use it on lines that are too safe or too on-the-nose. Sometimes it\'s funnier to call it three or four times in a row to push the player into absurdity. Pacing matters - don\'t interrupt every line, just the ones where a redo would land harder.',
  },

  // --- AUDIENCE-VOLUNTEER GAMES ---
  {
    id: 'press_conference',
    name: 'Press Conference',
    tags: ['3 players', '4 players', '5+ players', 'Audience participation', 'Bonus Point', 'Genre'],
    constraints: ['guessing', 'audience_on_stage'],
    description: 'One performer leaves the room. The audience decides on a celebrity, politician, or famous figure that the performer "is." The performer returns to a press conference where the audience (in role as reporters) asks them questions appropriate to that person. The performer has to figure out who they are from the questions.',
    delivery: 'Press Conference. One of you steps out of earshot. [Get a celebrity or famous figure from the audience.] Audience, you\'re now the press at this person\'s press conference - ask them questions that only make sense for who they are. Performer comes back. You\'re holding a press conference but you don\'t know who you are - guess from the questions. You can guess at any time. [check player going out]',
    notes: 'Coach the audience briefly before bringing the performer back: questions should be specific enough to identify the figure but not so on-the-nose that it\'s instant ("Mr. President, about the moon landing..." is too easy). The performer should commit to answering even while still guessing - dodging questions politician-style is part of the gag.',
    similarTo: ['lets_make_a_date', 'party_quirks'],
  },
  {
    id: 'story_story_die',
    name: 'Story Story Die',
    tags: ['4 players', '5+ players', 'Tiebreaker', 'Audience participation', 'High Energy', 'Lightning Round', 'Narrative'],
    constraints: [],
    description: 'Players line up. The director points at one player to begin telling a story. The director can switch to any other player mid-sentence, even mid-word, and that player must pick up cleanly. If a player hesitates, breaks grammar, or repeats, the audience yells "Die!" and the player dramatically dies. Last one standing wins.',
    delivery: 'Story Story Die. Players in a line up here. I\'ll point at one of you to start the story - audience gives us a story title. I can switch to anyone, anytime, mid-word if I want. Pick up cleanly. If you hesitate, fumble, or repeat - audience, you yell "Die!" and they have to die for us, dramatically. Last one standing wins. [check players, check audience: ready to yell?]',
    notes: 'The dying part is a feature, not a bug - encourage performers to die big and theatrical. The audience interaction keeps them engaged. Switch quickly and unpredictably; pointing at the same player for too long lets them coast. Common failure modes: connecting sentences with "and" too often, or restarting the same noun.',
    similarTo: ['story'],
  },
  {
    id: 'build_the_object',
    name: 'Build the Object',
    tags: ['3 players', 'Audience participation', 'Bonus Point'],
    constraints: ['guessing', 'audience_on_stage'],
    description: 'An audience volunteer is shown an object (or a written prompt) the performers cannot see. They pantomime using the object - washing dishes, riding a horse, conducting an orchestra. The performers must figure out what it is. First correct guess wins a bonus point.',
    delivery: 'Build the Object. I need an audience volunteer up here [point]. I\'ll show you an object [or hand them a card]. Performers, eyes closed for a moment. Volunteer, your job is to pantomime using this object - no speaking, no spelling, just physical demonstration. Performers, open your eyes when I say go. First correct guess wins. [check volunteer: comfortable miming? check performers]',
    notes: 'Have a small list of objects ready going in - or use audience-suggested ones written on cards. Coach the volunteer to start with the broadest physical strokes (the size, the orientation) before getting into the specifics. The performers calling out wrong guesses ("a fish! a really big fish!") is half the comedy.',
    similarTo: ['five_things'],
  },

  // --- PHYSICAL / SILENT (good for Dan and physical players) ---
  {
    id: 'dance_lessons',
    name: 'Dance Lessons',
    tags: ['2 players', 'Silent', 'Physical', 'Physical Contact'],
    constraints: ['physical_contact'],
    description: 'A silent scene. One player is a dance instructor; the other is a hapless student. The instructor teaches the student a dance - tango, ballroom, swing, anything from the audience. All communication is physical: demonstrations, corrections, frustrations, breakthroughs.',
    delivery: 'Dance Lessons. Two players. One of you is the instructor, the other is the student. Audience gives us a style of dance. The whole scene is silent - no dialog, no gibberish, just physical communication. Instructor: you\'re teaching. Student: you\'re trying. [check players: comfortable with the physical contact?]',
    notes: 'The silence forces clarity of physical storytelling - watch for moments of mutual frustration, small triumphs, the dynamics of the teacher-student relationship. Good music underneath helps. Avoid letting either player mouth words; that\'s a slippery slope.',
    similarTo: ['mime_cell'],
  },
  {
    id: 'mime_cell',
    name: 'Mime Cell',
    tags: ['Solo scene', '2 players', 'Silent', 'Physical'],
    constraints: [],
    description: 'A solo or two-player silent piece, played with full physical commitment. The audience suggests a scenario - escaping a sinking ship, getting locked in a museum overnight, performing surgery on a robot. No dialog, no sound effects from performers. Pure physical storytelling.',
    delivery: 'Mime Cell. One or two players. Audience gives us a scenario - something with strong physical demands. No dialog, no gibberish, no vocalizations. Pure mime, pure physical storytelling. Make us see what you see. [check players]',
    notes: 'Coach the players in advance to commit to object permanence - if they set down an imaginary glass at one spot on stage, it stays there. Big, slow movements read better than small fast ones. Hold their final image briefly before clearing the stage; the silence gives the bit a different rhythm than a normal scene.',
    similarTo: ['dance_lessons'],
  },
  {
    id: 'slideshow',
    name: 'Slideshow',
    tags: ['3 players', '4 players', 'Narrative', 'Audience participation'],
    constraints: [],
    description: 'One player narrates a vacation slideshow (or family album, business trip, school field trip) while the other players freeze in dramatic poses representing each slide. The narrator calls "next slide!" and the frozen players snap into a new pose. The narrator describes what we\'re "seeing" in each.',
    delivery: 'Slideshow. One narrator, two or three slide-actors. Audience gives us a vacation destination - or whatever event. Narrator, you\'re walking us through the photos. Call "next slide!" and the actors snap into a frozen pose. You describe what we\'re seeing. [check players]',
    notes: 'Reverses the verbal load - the narrator does all the talking, the slide actors don\'t speak at all. The poses should be specific and committed - half-frozen poses look like stalling. Coach the narrator to describe the *backstory* of each slide ("This was right after Greg fell into the ravine, you can still see the bruise..."), not just what\'s in the frame.',
  },
  {
    id: 'conducted_story',
    name: 'Conducted Story',
    tags: ['3 players', '4 players', 'Narrative', 'Audience participation'],
    constraints: [],
    description: 'Two or three players tell a continuous story. A "conductor" stands in front of them and controls speed, volume, pitch, and emotion through physical gestures - hands up means louder, palm forward means slower, finger spinning means faster, and so on. The storytellers must immediately match.',
    delivery: 'Conducted Story. Two or three storytellers in a back line, one conductor in front. Audience gives us a story title. Storytellers tell a continuous story together, switching when the conductor points. Conductor: you control speed, volume, pitch, emotion with your gestures. Hands up loud, palm forward slow, spin fast, and so on. Storytellers, match instantly. [check players]',
    notes: 'A good director-chair role for players who don\'t want to do a lot of speaking. Conductor should make bold, clear choices - subtle gestures get missed. Coach the storytellers to commit fully to whatever the conductor calls for; whisper means *whisper*, not "talking quietly." Works well as a Round 2 or 3 piece for variety.',
  },

  // --- BONUS-POINT AND TIEBREAKER DEPTH ---
  {
    id: 'what_are_you_doing',
    name: 'What Are You Doing?',
    tags: ['2 players', '3 players', 'Tiebreaker', 'Lightning Round', 'Physical'],
    constraints: ['rapid_speech'],
    description: 'Player A asks "What are you doing?" Player B answers with an action they are NOT currently doing (e.g., "Brushing my teeth"). Player A then begins doing that action. Player B asks them "What are you doing?" Player A answers with something else they aren\'t doing. And so on, lightning-fast. Hesitate, repeat, or do what you just said and you\'re out.',
    delivery: 'What Are You Doing? Two or three players. Player one asks the other "What are you doing?" Player two answers with something they are NOT currently doing. Player one then DOES that thing. Then they ask the next person "What are you doing?" and the cycle repeats. Lightning round. Hesitate, repeat, or say what you\'re actually doing and you\'re out. [check players]',
    notes: 'Classic Whose Line tiebreaker. Speed is everything - if it slows down, the tension dies. Common failure modes: saying something physically impossible (which the next person can\'t actually mime), repeating an action that\'s already been used, or accidentally describing what you\'re visibly doing. Encourage players to think one step ahead.',
  },
  {
    id: 'sentences_countdown',
    name: 'Sentences',
    tags: ['2 players', '3 players', 'Verbal Restriction', 'Thinky'],
    constraints: ['wordplay'],
    description: 'A scene where each player\'s lines have to follow a descending word-count pattern. Start at 5 words per line, drop to 4, then 3, then 2, then 1. Each new word count locks for both players for a few exchanges before dropping again. The escalation forces the scene to its essentials.',
    delivery: 'Sentences. Two or three players, scene from an audience suggestion. Every line of dialog has to be exactly five words. After a few exchanges I\'ll call "four" - now every line is four words. Then three. Then two. Then one. The scene narrows as it goes. [check players]',
    notes: 'Built-in escalator - the scene gets tighter and more emotional as the word count drops. The one-word ending often lands as the strongest beat. Players tend to count on their fingers; that\'s fine and part of the comedy. Common failure: cheating with contractions (is "don\'t" one word or two? Decide before starting).',
    similarTo: ['x_word_sentences'],
  },
  {
    id: 'five_things',
    name: 'Five Things',
    tags: ['2 players', '3 players', 'Bonus Point', 'Audience participation', 'Lightning Round', 'Physical'],
    constraints: ['guessing'],
    description: 'One player (the guesser) leaves the room. The audience supplies five strange things - an unusual job, a weird quirk, an unlikely event, an absurd object, an embarrassing secret. The guesser returns. The other player must pantomime and gesture to communicate all five things in sequence without speaking. The guesser tries to identify each one. Bonus point for getting all five.',
    delivery: 'Five Things. One of you is the guesser, step out of earshot. [Get five things from the audience.] Performer comes back. Your scene partner has to pantomime all five things in order, no talking. Guesser, you call out what you think each one is. We don\'t move on until you\'ve guessed it. Bonus point for getting all five. [check players]',
    notes: 'The pantomimer should commit to one thing at a time fully before moving on - rapid switching confuses the guesser. The guesser should narrate their guesses loudly so the audience knows what they\'re seeing. Time pressure makes it funnier; if it drags, prompt them along. Common: the pantomimer giving up and just pointing wildly when stuck.',
    similarTo: ['build_the_object'],
  },

  // --- GENRE-SPECIFIC ---
  {
    id: 'greatest_hits',
    name: 'Greatest Hits',
    tags: ['3 players', '4 players', 'Music', 'Singing', 'Tech', 'Genre', 'High Energy', 'Audience participation'],
    constraints: ['singing'],
    description: 'A musical revue. The director introduces the show as "Tonight we celebrate the songs of [made-up artist name]!" The cast performs short snippets of the artist\'s "hits," each one called out by audience-suggested song titles. The cast improvises each song in a different style.',
    delivery: 'Greatest Hits. We need a fake artist name from the audience - the cheesier the better. [Build a fake intro: "Ladies and gentlemen, tonight we celebrate the songs of..."] Now we need song titles - just call them out. We\'ll do short snippets of each one in different styles - ballad, rock, country, whatever fits. Tech, you\'re with us. [check players, check tech]',
    notes: 'Each song should be short - 30 seconds at most. The artist intro can be repeated between songs ("And next, that classic 1987 deep cut...") for structure. Audience suggestions tend to be punny - lean in. Save the biggest, most absurd title for the closer.',
    similarTo: ['three_headed_broadway_star'],
  },
  {
    id: 'soap_opera_sweeps_week',
    name: 'Soap Opera Sweeps Week',
    tags: ['3 players', '4 players', 'Genre', 'High Energy'],
    constraints: [],
    description: 'An extension of Instant Soap Opera with one added rule: the scene must end on a cliffhanger. Players run a full melodramatic soap scene - love triangles, surprise reveals, evil twins - and the director cues the cliffhanger ending at the moment of maximum drama.',
    delivery: 'Soap Opera Sweeps Week. Three or four players. Audience gives us a melodramatic premise - someone\'s pregnant, someone\'s got amnesia, someone\'s evil twin is back from the dead. Play it for maximum melodrama. Most importantly: this scene must END on a cliffhanger - I\'ll call "cliffhanger" at the peak dramatic moment and you freeze in shock. [check players]',
    notes: 'The cliffhanger ending is the key constraint - players should be building toward it the whole scene, planting potential reveals that can land at the end. Music sting on the freeze is essential. If the players aren\'t escalating fast enough, throw in audience-suggested complications ("and the audience demands - a secret pregnancy!").',
    similarTo: ['instant_soap_opera'],
  },
  {
    id: 'mockumentary',
    name: 'Mockumentary',
    tags: ['3 players', '4 players', '5+ players', 'Genre', 'Complicated'],
    constraints: [],
    description: 'A talking-head documentary style. The cast plays characters in some absurd workplace, family, or community. Scenes alternate between group action and individual "confessional" interviews where a character speaks directly to camera (the audience) about what just happened. The Office, Parks and Rec, This Is Spinal Tap.',
    delivery: 'Mockumentary. Three or more players. Audience gives us the world - workplace, family, social club. We alternate between scenes and confessional interviews. When I tap your shoulder, you step out, sit in this chair [point], and speak directly to the camera about what just happened. Then back into the scene. [check players]',
    notes: 'Strong choice when you have several players who can sustain distinct characters. The confessionals work best when they contradict what just happened ("Yeah, I had no idea what was going on in there.") or reveal hidden motives. Don\'t over-rotate to the confessionals; the scene action is still the engine. Cap each confessional at 15-20 seconds.',
  },

  // --- FINAL-ROUND SOLO CLOSERS ---
  {
    id: 'last_words',
    name: 'Last Words',
    tags: ['Solo scene', 'Audience participation'],
    constraints: [],
    description: 'A solo deathbed monolog. The audience supplies a regret - something the dying character never got to say, do, or admit. The performer delivers their final words. Can be played for pathos, comedy, or both.',
    delivery: 'Last Words. One player. Audience gives us a regret - something this character never got to say, do, or admit. You\'re on your deathbed. These are your final words. [check player]',
    notes: 'Strong Round 5 closer for an emotionally-grounded player. Coach toward specifics - the regret should land on one concrete moment, not a vague feeling. Music underneath helps. The comedy version (regretting forgetting to set the PVR for the season finale) and the pathos version (the words never said to a parent) are both valid; let the player choose.',
    similarTo: ['villain_speech', 'acceptance_speech', 'the_pitch'],
  },
  {
    id: 'acceptance_speech',
    name: 'Acceptance Speech',
    tags: ['Solo scene', 'Audience participation', 'High Energy', 'Bonus Point'],
    constraints: [],
    description: 'The performer has just won an absurd, audience-suggested award. They deliver an acceptance speech in the style of their choosing - tearfully grateful, vengefully petty, drunkenly confused, professionally polished.',
    delivery: 'Acceptance Speech. One player. Audience gives us an award - the more absurd the better. You\'ve just won it. Deliver the speech. [check player]',
    notes: 'Coach the player to commit to a specific tone in the first sentence - "I never thought this day would come" reads completely differently than "Finally. FINALLY." A music sting or applause underneath helps land the bit. The thanks-the-people-who-doubted-me variant is a reliable comic structure.',
    similarTo: ['villain_speech', 'last_words', 'the_pitch'],
  },
  {
    id: 'the_pitch',
    name: 'The Pitch',
    tags: ['Solo scene', 'Audience participation', 'Bonus Point'],
    constraints: [],
    description: 'A solo monolog. The performer pitches an absurd product, movie idea, business venture, or government policy to an imaginary audience of investors, executives, or constituents. Full salesperson commitment to a terrible idea.',
    delivery: 'The Pitch. One player. Audience gives us a product, a movie idea, or a business venture - the dumber the better. You\'re pitching it to a room full of investors. Make us believe. [check player]',
    notes: 'The comedy lives in the gap between the absurd idea and the absolute conviction of the pitch. The "and here\'s where it gets exciting" or "let me show you the numbers" beats give a structure to build to. Encourage references to a fake co-founder or a competitor (\"and I know what you\'re thinking - what about LinkedIn?\"). Strong Round 5 closer.',
    similarTo: ['villain_speech', 'last_words', 'acceptance_speech'],
  },
];

// ============================================================
// DEFAULT MAESTRO RUNNING ORDER
// ============================================================

const DEFAULT_FORMAT = {
  title: 'Sample Maestro Running Order',
  subtitle: 'For Wayward Improvised Theatre',
  preShow: ['Hold for audience stragglers', 'Host intro'],
  rounds: [
    { number: 1, playersOnStage: 10, games: [
      { gameId: null, playersInGame: '10 (all-play)', note: '' },
      { gameId: null, playersInGame: 4, note: '' },
      { gameId: null, playersInGame: 3, note: '' },
      { gameId: null, playersInGame: 3, note: '' },
    ], eliminate: 0 },
    { number: 2, playersOnStage: 10, games: [
      { gameId: null, playersInGame: 2, note: '' },
      { gameId: null, playersInGame: 4, note: '' },
      { gameId: null, playersInGame: 2, note: '' },
      { gameId: null, playersInGame: 2, note: '' },
    ], eliminate: 3 },
    { number: 3, playersOnStage: 7, games: [
      { gameId: null, playersInGame: 3, note: '' },
      { gameId: null, playersInGame: 2, note: '' },
      { gameId: null, playersInGame: 2, note: '' },
    ], eliminate: 2 },
    { number: 4, playersOnStage: 5, games: [
      { gameId: null, playersInGame: 2, note: '' },
      { gameId: null, playersInGame: 1, note: '' },
      { gameId: null, playersInGame: 2, note: '' },
    ], eliminate: 2 },
    { number: 5, playersOnStage: 3, games: [
      { gameId: null, playersInGame: 1, note: '' },
      { gameId: null, playersInGame: 1, note: '' },
      { gameId: null, playersInGame: 1, note: '' },
    ], eliminate: 2 },
  ],
  postShow: ['Declare Maestro and conclude the show'],
};

// ============================================================
// FORMAT GENERATOR
// ============================================================
// Builds a sample Maestro running order from tonight's cast.
// Respects player preferences (no conflicts), prefers good fits,
// and avoids putting two similar games in the same show.

// Round templates by cast size: each entry is { playersOnStage, eliminate, gameSlots }
// gameSlots are the player-count tags this round should target, in order.
function getRoundTemplate(castSize) {
  if (castSize >= 10) {
    return [
      { playersOnStage: 10, eliminate: 0, gameSlots: ['5+ players', '4 players', '3 players', '2 players'], notes: 'Opener - full cast on stage' },
      { playersOnStage: 10, eliminate: 3, gameSlots: ['2 players', '4 players', '2 players', '3 players'], notes: 'Pre-elimination - dense round' },
      { playersOnStage: 7, eliminate: 2, gameSlots: ['3 players', '2 players', '2 players'], notes: 'First narrowing' },
      { playersOnStage: 5, eliminate: 2, gameSlots: ['2 players', 'Solo scene', '2 players'], notes: 'Build to finale' },
      { playersOnStage: 3, eliminate: 2, gameSlots: ['Solo scene', 'Solo scene', 'Solo scene'], notes: 'Final round - solo scenes' },
    ];
  }
  if (castSize === 9) {
    return [
      { playersOnStage: 9, eliminate: 0, gameSlots: ['5+ players', '4 players', '3 players', '2 players'], notes: 'Opener' },
      { playersOnStage: 9, eliminate: 3, gameSlots: ['2 players', '4 players', '3 players', '2 players'], notes: 'Pre-elimination' },
      { playersOnStage: 6, eliminate: 2, gameSlots: ['3 players', '2 players', '2 players'], notes: 'First narrowing' },
      { playersOnStage: 4, eliminate: 2, gameSlots: ['2 players', 'Solo scene', '2 players'], notes: 'Build to finale' },
      { playersOnStage: 2, eliminate: 1, gameSlots: ['Solo scene', 'Solo scene', 'Solo scene'], notes: 'Final round' },
    ];
  }
  if (castSize === 8) {
    return [
      { playersOnStage: 8, eliminate: 0, gameSlots: ['5+ players', '4 players', '3 players', '2 players'], notes: 'Opener' },
      { playersOnStage: 8, eliminate: 2, gameSlots: ['4 players', '2 players', '3 players', '2 players'], notes: 'Pre-elimination' },
      { playersOnStage: 6, eliminate: 2, gameSlots: ['3 players', '2 players', '2 players'], notes: 'First narrowing' },
      { playersOnStage: 4, eliminate: 2, gameSlots: ['2 players', 'Solo scene', '2 players'], notes: 'Build to finale' },
      { playersOnStage: 2, eliminate: 1, gameSlots: ['Solo scene', 'Solo scene'], notes: 'Final round' },
    ];
  }
  if (castSize === 7) {
    return [
      { playersOnStage: 7, eliminate: 0, gameSlots: ['5+ players', '4 players', '3 players'], notes: 'Opener' },
      { playersOnStage: 7, eliminate: 2, gameSlots: ['3 players', '2 players', '4 players', '2 players'], notes: 'Pre-elimination' },
      { playersOnStage: 5, eliminate: 2, gameSlots: ['3 players', '2 players', '2 players'], notes: 'First narrowing' },
      { playersOnStage: 3, eliminate: 2, gameSlots: ['Solo scene', 'Solo scene', 'Solo scene'], notes: 'Final round' },
    ];
  }
  if (castSize === 6) {
    return [
      { playersOnStage: 6, eliminate: 0, gameSlots: ['4 players', '3 players', '2 players'], notes: 'Opener' },
      { playersOnStage: 6, eliminate: 2, gameSlots: ['3 players', '2 players', '2 players', '4 players'], notes: 'Pre-elimination' },
      { playersOnStage: 4, eliminate: 2, gameSlots: ['2 players', 'Solo scene', '2 players'], notes: 'Build to finale' },
      { playersOnStage: 2, eliminate: 1, gameSlots: ['Solo scene', 'Solo scene'], notes: 'Final round' },
    ];
  }
  if (castSize === 5) {
    return [
      { playersOnStage: 5, eliminate: 0, gameSlots: ['4 players', '3 players', '2 players'], notes: 'Opener' },
      { playersOnStage: 5, eliminate: 2, gameSlots: ['3 players', '2 players', '2 players'], notes: 'Pre-elimination' },
      { playersOnStage: 3, eliminate: 2, gameSlots: ['Solo scene', 'Solo scene', 'Solo scene'], notes: 'Final round' },
    ];
  }
  if (castSize === 4) {
    return [
      { playersOnStage: 4, eliminate: 0, gameSlots: ['4 players', '3 players', '2 players'], notes: 'Opener' },
      { playersOnStage: 4, eliminate: 2, gameSlots: ['2 players', '3 players', '2 players'], notes: 'Pre-elimination' },
      { playersOnStage: 2, eliminate: 1, gameSlots: ['Solo scene', 'Solo scene'], notes: 'Final round' },
    ];
  }
  // < 4: just a freeform short show
  return [
    { playersOnStage: castSize, eliminate: 0, gameSlots: ['2 players', '2 players', 'Solo scene'], notes: 'Short show - no eliminations recommended' },
  ];
}

// Check if a game conflicts with the cast (any player has a flagging preference).
function gameConflictsWithCast(game, cast, allPrefs) {
  for (const player of cast) {
    for (const prefId of (player.preferences || [])) {
      const pref = allPrefs.find(p => p.id === prefId);
      if (!pref) continue;
      for (const c of (pref.flagConstraints || [])) {
        if (game.constraints.includes(c)) return true;
      }
      for (const t of (pref.flagTags || [])) {
        if (game.tags.includes(t)) return true;
      }
    }
  }
  return false;
}

// Count unique boost players (good fit score).
function gameBoostScore(game, cast, allPrefs) {
  const boostedPlayers = new Set();
  for (const player of cast) {
    for (const prefId of (player.preferences || [])) {
      const pref = allPrefs.find(p => p.id === prefId);
      if (!pref) continue;
      for (const c of (pref.boostConstraints || [])) {
        if (game.constraints.includes(c)) boostedPlayers.add(player.id);
      }
      for (const t of (pref.boostTags || [])) {
        if (game.tags.includes(t)) boostedPlayers.add(player.id);
      }
    }
  }
  return boostedPlayers.size;
}

// Get the set of similar-game IDs for a given game (forward + reverse links).
function getSimilarCluster(gameId) {
  const cluster = new Set([gameId]);
  const game = GAMES.find(g => g.id === gameId);
  if (game && game.similarTo) {
    for (const sim of game.similarTo) cluster.add(sim);
  }
  // Reverse links: any game that has this in its similarTo
  for (const g of GAMES) {
    if ((g.similarTo || []).includes(gameId)) cluster.add(g.id);
  }
  return cluster;
}

function generateFormatFromCast(cast, allPrefs) {
  const castSize = cast.length;
  const template = getRoundTemplate(castSize);

  const rounds = template.map((tmpl, roundIdx) => {
    const games = tmpl.gameSlots.map((targetTag, slotIdx) => {
      let playersInGame;
      if (targetTag === 'Solo scene') playersInGame = 1;
      else if (targetTag === '2 players') playersInGame = 2;
      else if (targetTag === '3 players') playersInGame = 3;
      else if (targetTag === '4 players') playersInGame = 4;
      else if (targetTag === '5+ players') playersInGame = `${castSize} (all-play)`;
      else playersInGame = 2;

      return { gameId: null, playersInGame, note: '' };
    });

    return {
      number: roundIdx + 1,
      playersOnStage: tmpl.playersOnStage,
      games,
      eliminate: tmpl.eliminate,
    };
  });

  return {
    title: `Tonight's Maestro Running Order`,
    subtitle: `Generated from a cast of ${castSize}`,
    preShow: ['Hold for audience stragglers', 'Host intro'],
    rounds,
    postShow: ['Declare Maestro and conclude the show'],
  };
}

// Given a played game and the current format, find the best slot to assign it to.
// Returns { roundIdx, slotIdx } or null if no slot is available.
// Prefers slots whose playersInGame matches the game's actual player count.
function findBestSlotForGame(game, format, playedGameIds) {
  if (!format || !format.rounds) return null;

  // Walk rounds in order; pick the first empty slot in the first round with empty slots.
  // Within that round, prefer slots whose playersInGame matches the game's tag.
  const gamePlayerCounts = [];
  if (game.tags.includes('Solo scene')) gamePlayerCounts.push(1);
  if (game.tags.includes('2 players')) gamePlayerCounts.push(2);
  if (game.tags.includes('3 players')) gamePlayerCounts.push(3);
  if (game.tags.includes('4 players')) gamePlayerCounts.push(4);
  if (game.tags.includes('5+ players')) gamePlayerCounts.push(5);

  for (let r = 0; r < format.rounds.length; r++) {
    const round = format.rounds[r];
    if (!round.games || round.games.length === 0) continue;

    // Skip rounds that are fully filled
    const emptySlots = round.games
      .map((slot, idx) => ({ slot, idx }))
      .filter(({ slot }) => !slot.gameId);
    if (emptySlots.length === 0) continue;

    // Prefer empty slots whose playersInGame matches the game's tags
    let preferredSlot = emptySlots.find(({ slot }) => {
      if (typeof slot.playersInGame === 'number') {
        return gamePlayerCounts.includes(slot.playersInGame) ||
               (slot.playersInGame >= 5 && game.tags.includes('5+ players'));
      }
      if (typeof slot.playersInGame === 'string' && slot.playersInGame.includes('all-play')) {
        return game.tags.includes('5+ players');
      }
      return false;
    });

    // If no preferred match, take the first empty slot
    if (!preferredSlot) preferredSlot = emptySlots[0];

    return { roundIdx: r, slotIdx: preferredSlot.idx };
  }
  return null;
}

// Suggest the next game to play, looking at the next empty slot in the current round.
// Returns { game, slotIdx, roundIdx, reason } or null.
function suggestNextGame(format, playedGameIds, cast, allPrefs) {
  if (!format || !format.rounds || cast.length === 0) return null;

  const playedSet = new Set(playedGameIds);
  const usedClusters = new Set();
  for (const id of playedGameIds) {
    const cluster = getSimilarCluster(id);
    for (const cid of cluster) usedClusters.add(cid);
  }

  // Find current round and first empty slot
  for (let r = 0; r < format.rounds.length; r++) {
    const round = format.rounds[r];
    if (!round.games || round.games.length === 0) continue;
    const emptyIdx = round.games.findIndex(g => !g.gameId);
    if (emptyIdx === -1) continue;

    const slot = round.games[emptyIdx];

    // Build target player-count tag from the slot
    let targetTag = null;
    if (typeof slot.playersInGame === 'number') {
      if (slot.playersInGame === 1) targetTag = 'Solo scene';
      else if (slot.playersInGame === 2) targetTag = '2 players';
      else if (slot.playersInGame === 3) targetTag = '3 players';
      else if (slot.playersInGame === 4) targetTag = '4 players';
      else if (slot.playersInGame >= 5) targetTag = '5+ players';
    } else if (typeof slot.playersInGame === 'string' && slot.playersInGame.includes('all-play')) {
      targetTag = '5+ players';
    }

    let candidates = targetTag
      ? GAMES.filter(g => g.tags.includes(targetTag))
      : GAMES.slice();

    candidates = candidates.filter(g => !playedSet.has(g.id) && !usedClusters.has(g.id));
    candidates = candidates.filter(g => !gameConflictsWithCast(g, cast, allPrefs));

    if (candidates.length === 0) return null;

    candidates = candidates.map(g => ({
      game: g, boostScore: gameBoostScore(g, cast, allPrefs),
    }));
    candidates.sort((a, b) => b.boostScore - a.boostScore);

    return {
      game: candidates[0].game,
      boostScore: candidates[0].boostScore,
      roundIdx: r,
      slotIdx: emptyIdx,
      reason: `Round ${round.number}, slot ${emptyIdx + 1}`,
    };
  }
  return null;
}

// Fill every empty slot in the format with a suggested game.
// Returns a map: { 'roundIdx_slotIdx': { game, boostScore } } for each empty slot that got a suggestion.
// Used by the print view to show suggestions for all remaining slots.
function suggestAllForFormat(format, playedGameIds, cast, allPrefs) {
  const result = {};
  if (!format || !format.rounds || cast.length === 0) return result;

  const playedSet = new Set(playedGameIds);
  const usedGames = new Set(playedGameIds);
  const usedClusters = new Set();
  for (const id of playedGameIds) {
    const cluster = getSimilarCluster(id);
    for (const cid of cluster) usedClusters.add(cid);
  }

  for (let r = 0; r < format.rounds.length; r++) {
    const round = format.rounds[r];
    if (!round.games || round.games.length === 0) continue;

    for (let s = 0; s < round.games.length; s++) {
      const slot = round.games[s];
      if (slot.gameId) continue; // already filled

      // Determine target tag from slot
      let targetTag = null;
      if (typeof slot.playersInGame === 'number') {
        if (slot.playersInGame === 1) targetTag = 'Solo scene';
        else if (slot.playersInGame === 2) targetTag = '2 players';
        else if (slot.playersInGame === 3) targetTag = '3 players';
        else if (slot.playersInGame === 4) targetTag = '4 players';
        else if (slot.playersInGame >= 5) targetTag = '5+ players';
      } else if (typeof slot.playersInGame === 'string' && slot.playersInGame.includes('all-play')) {
        targetTag = '5+ players';
      }

      let candidates = targetTag
        ? GAMES.filter(g => g.tags.includes(targetTag))
        : GAMES.slice();

      candidates = candidates.filter(g => !usedGames.has(g.id) && !usedClusters.has(g.id));
      candidates = candidates.filter(g => !gameConflictsWithCast(g, cast, allPrefs));
      if (candidates.length === 0) continue;

      candidates = candidates.map(g => ({
        game: g, boostScore: gameBoostScore(g, cast, allPrefs),
      }));
      candidates.sort((a, b) => b.boostScore - a.boostScore);

      const chosen = candidates[0];
      result[`${r}_${s}`] = chosen;
      usedGames.add(chosen.game.id);
      const cluster = getSimilarCluster(chosen.game.id);
      for (const cid of cluster) usedClusters.add(cid);
    }
  }

  return result;
}

// ============================================================
// SEED ROSTER
// ============================================================

const SEED_PLAYERS = [
  { id: 'adam', name: 'Adam Goldberg', preferences: ['loves_guessing'], notes: 'Wants a CSI game.' },
  { id: 'bruce', name: 'Bruce Lee-Shanok', preferences: ['no_worlds_worst', 'loves_audience'], notes: 'Loves audience on stage. Would enjoy a Dream game.' },
  { id: 'chris', name: 'Chris Durrant', preferences: ['no_singing'], notes: '' },
  { id: 'dan', name: 'Dan Patterson', preferences: ['no_rapid_speech', 'no_wordplay'], notes: 'Severe stammer. Skip Alphabet, Questions Only, Story as teller. Great for Sound Effects, Foreign Film Dub, Expert (gibberish), physical games.' },
  { id: 'gilbert', name: 'Gilbert El-Dick', preferences: [], notes: '' },
  { id: 'heather', name: 'Heather Corbett', preferences: [], notes: '' },
  { id: 'matthew', name: 'Matthew Versace', preferences: [], notes: '' },
  { id: 'nancy', name: 'Nancy Lee', preferences: [], notes: 'Loves the "take over from frozen positions" mechanic. Frozen Inheritance and Dead Bodies are her pitch.' },
  { id: 'schyler', name: 'Schyler Fevens', preferences: ['loves_audience', 'loves_experimental'], notes: '' },
  { id: 'sophie', name: 'Sophie Twardus', preferences: [], notes: '' },
];

// ============================================================
// STORAGE
// ============================================================

const KEY_ROSTER = 'wayward:roster:v6';
const KEY_SESSION = 'wayward:session:v6';
const KEY_FORMAT = 'wayward:format:v6';
const KEY_PLAYED = 'wayward:played:v6';
const KEY_CUSTOM_PREFS = 'wayward:custom_prefs:v6';

async function loadKey(key, fallback) {
  try {
    const r = await window.storage.get(key);
    if (r && r.value) return JSON.parse(r.value);
  } catch (e) {}
  return fallback;
}
async function saveKey(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); }
  catch (e) { console.error('save failed', key, e); }
}

// ============================================================
// EVALUATION
// ============================================================

function evaluateGame(game, tonightCast, allPrefs) {
  const conflicts = [];
  const boosts = [];
  for (const player of tonightCast) {
    for (const prefId of (player.preferences || [])) {
      const pref = allPrefs.find(p => p.id === prefId);
      if (!pref) continue;
      for (const c of (pref.flagConstraints || [])) {
        if (game.constraints.includes(c)) {
          conflicts.push({ playerId: player.id, playerName: player.name, pref: pref.label });
        }
      }
      for (const t of (pref.flagTags || [])) {
        if (game.tags.includes(t)) {
          conflicts.push({ playerId: player.id, playerName: player.name, pref: pref.label });
        }
      }
      for (const t of (pref.boostTags || [])) {
        if (game.tags.includes(t)) {
          boosts.push({ playerId: player.id, playerName: player.name });
        }
      }
      for (const c of (pref.boostConstraints || [])) {
        if (game.constraints.includes(c)) {
          boosts.push({ playerId: player.id, playerName: player.name });
        }
      }
    }
  }
  return { conflicts, boosts };
}

function evaluateShapeOfShow(game, playedGameIds) {
  const reasons = [];
  for (const sim of (game.similarTo || [])) {
    if (playedGameIds.includes(sim)) {
      const simGame = GAMES.find(g => g.id === sim);
      reasons.push(`Similar to ${simGame ? simGame.name : sim} (already played)`);
    }
  }
  for (const playedId of playedGameIds) {
    const played = GAMES.find(g => g.id === playedId);
    if (played && (played.similarTo || []).includes(game.id)) {
      reasons.push(`Similar to ${played.name} (already played)`);
    }
  }
  if (playedGameIds.includes(game.id)) {
    reasons.push('This game has already been played tonight');
  }
  return reasons;
}

// ============================================================
// SHOW PROGRESS ANALYSIS
// ============================================================
// Given the current format, played games, and cast, work out where in the
// show the user likely is and what to suggest next. Pure function, no UI.

function getShowProgress(format, playedGameIds, tonightCast) {
  const totalPlayed = playedGameIds.length;
  const castSize = tonightCast.length;
  const playedSet = new Set(playedGameIds);

  // Find current round: the first round in the format that has unplayed games,
  // or has been "entered" (at least one game played from it).
  let currentRoundIdx = -1;
  let nextSlot = null; // the next unplayed game slot in the format, if any
  let gamesPlayedInRound = 0;
  let totalEliminationsScheduled = 0;
  let eliminationsBeforeCurrentRound = 0;

  if (format && format.rounds && format.rounds.length > 0) {
    for (let i = 0; i < format.rounds.length; i++) {
      const round = format.rounds[i];
      const allPlayed = round.games.length > 0 && round.games.every(g => playedSet.has(g.gameId));
      if (allPlayed) {
        totalEliminationsScheduled += (round.eliminate || 0);
        continue;
      }
      // First round with at least one unplayed game (or empty round)
      currentRoundIdx = i;
      gamesPlayedInRound = round.games.filter(g => playedSet.has(g.gameId)).length;
      const firstUnplayed = round.games.find(g => !playedSet.has(g.gameId));
      if (firstUnplayed) nextSlot = firstUnplayed;
      eliminationsBeforeCurrentRound = totalEliminationsScheduled;
      break;
    }
  }

  // If no current round (all rounds completed or empty format), fall back to inference.
  const hasFormatGuide = currentRoundIdx >= 0 && format.rounds[currentRoundIdx].games.length > 0;
  const currentRound = currentRoundIdx >= 0 ? format.rounds[currentRoundIdx] : null;

  // Tags from the most recent played games (last 3)
  const recentPlayedIds = playedGameIds.slice(-3);
  const recentTags = new Set();
  const recentConstraints = new Set();
  for (const id of recentPlayedIds) {
    const g = GAMES.find(gg => gg.id === id);
    if (!g) continue;
    for (const t of (g.tags || [])) recentTags.add(t);
    for (const c of (g.constraints || [])) recentConstraints.add(c);
  }

  // ----- Suggested player count -----
  let suggestedPlayerCount = null;
  let suggestedPlayerCountReason = '';
  if (nextSlot) {
    // From the format directly
    const pc = nextSlot.playersInGame;
    if (typeof pc === 'number') {
      if (pc === 1) { suggestedPlayerCount = 'Solo scene'; }
      else if (pc === 2) { suggestedPlayerCount = '2 players'; }
      else if (pc === 3) { suggestedPlayerCount = '3 players'; }
      else if (pc === 4) { suggestedPlayerCount = '4 players'; }
      else if (pc >= 5) { suggestedPlayerCount = '5+ players'; }
    } else if (typeof pc === 'string' && pc.includes('all-play')) {
      suggestedPlayerCount = '5+ players';
    }
    suggestedPlayerCountReason = 'Next slot in Round ' + currentRound.number;
  } else if (currentRound) {
    // Empty round, infer by stage size
    const onStage = currentRound.playersOnStage || castSize;
    if (onStage >= 7) suggestedPlayerCount = '3 players';
    else if (onStage >= 4) suggestedPlayerCount = '2 players';
    else suggestedPlayerCount = 'Solo scene';
    suggestedPlayerCountReason = `Round ${currentRound.number} stage size`;
  } else if (castSize > 0) {
    // No format guidance at all - infer from cast and how many games played
    if (totalPlayed === 0 && castSize >= 5) {
      suggestedPlayerCount = '5+ players';
      suggestedPlayerCountReason = 'Show opener - full cast on stage';
    } else if (castSize >= 5) {
      suggestedPlayerCount = '3 players';
      suggestedPlayerCountReason = 'Full cast still on stage';
    } else if (castSize >= 3) {
      suggestedPlayerCount = '2 players';
      suggestedPlayerCountReason = 'Mid-show cast size';
    } else {
      suggestedPlayerCount = 'Solo scene';
      suggestedPlayerCountReason = 'Finale - solo scenes';
    }
  }

  // ----- Style suggestions -----
  // Based on contrast with recent games. Returns array of { tag, reason }.
  const styleHints = [];
  if (recentTags.has('High Energy') && !recentTags.has('Thinky')) {
    styleHints.push({ tag: 'Thinky', reason: 'After a high-energy game, slow it down' });
  }
  if (recentTags.has('Verbal Restriction')) {
    styleHints.push({ tag: 'Physical', reason: 'After a verbal game, go physical' });
  }
  if (recentTags.has('Silent')) {
    styleHints.push({ tag: 'High Energy', reason: 'After a silent piece, bring the energy back' });
  }
  if (recentTags.has('Zone')) {
    styleHints.push({ tag: 'Genre', reason: 'After a zone game, try a single-genre piece' });
  }
  if (recentTags.has('Complicated') || recentTags.has('Thinky')) {
    if (!styleHints.some(h => h.tag === 'High Energy')) {
      styleHints.push({ tag: 'High Energy', reason: 'After a thinky game, lift the energy' });
    }
  }
  if (recentTags.has('Genre')) {
    styleHints.push({ tag: 'Lightning Round', reason: 'After a genre piece, change pace with something fast' });
  }
  // Check for back-to-back same player counts in recent games
  if (recentPlayedIds.length >= 2) {
    const playerCountTags = ['2 players', '3 players', '4 players', '5+ players', 'Solo scene'];
    const countTagsByGame = recentPlayedIds.map(id => {
      const g = GAMES.find(gg => gg.id === id);
      return g ? g.tags.filter(t => playerCountTags.includes(t)) : [];
    });
    if (countTagsByGame.length >= 2) {
      const lastTwo = countTagsByGame.slice(-2);
      const shared = lastTwo[0].filter(t => lastTwo[1].includes(t));
      if (shared.length > 0 && suggestedPlayerCount && shared.includes(suggestedPlayerCount)) {
        styleHints.push({ tag: null, reason: `Last 2 games were both ${shared[0]} - consider varying the count` });
      }
    }
  }

  // ----- Structural advice -----
  const structuralHints = [];
  if (currentRound) {
    const roundLength = currentRound.games.length;
    const remaining = roundLength - gamesPlayedInRound;
    if (roundLength > 0 && remaining === 0 && (currentRound.eliminate || 0) > 0) {
      structuralHints.push({
        kind: 'eliminate',
        text: `Eliminate ${currentRound.eliminate} player${currentRound.eliminate > 1 ? 's' : ''} before Round ${currentRound.number + 1}`,
      });
    } else if (roundLength > 0 && remaining === 1 && (currentRound.eliminate || 0) > 0) {
      structuralHints.push({
        kind: 'eliminate_soon',
        text: `1 game left in Round ${currentRound.number}, then eliminate ${currentRound.eliminate} player${currentRound.eliminate > 1 ? 's' : ''}`,
      });
    }
    // Final round signal
    if (currentRoundIdx === format.rounds.length - 1) {
      structuralHints.push({
        kind: 'finale',
        text: 'This is the final round - solo scenes work best',
      });
    }
    // Round 1 reminder
    if (currentRound.number === 1 && (currentRound.eliminate || 0) === 0) {
      structuralHints.push({
        kind: 'no_eliminate',
        text: 'Round 1 should not eliminate anyone',
      });
    }
  }
  // Scoring caution after Round 1
  if (currentRoundIdx === 1 && gamesPlayedInRound === 0) {
    structuralHints.push({
      kind: 'scoring',
      text: 'Round 2 ends in eliminations - watch for scores clustering',
    });
  }

  const isInFinale = currentRound && currentRoundIdx === (format?.rounds?.length || 0) - 1;

  return {
    currentRoundIdx,
    currentRound,
    nextSlot,
    totalPlayed,
    gamesPlayedInRound,
    hasFormatGuide,
    suggestedPlayerCount,
    suggestedPlayerCountReason,
    styleHints,
    structuralHints,
    recentTags: Array.from(recentTags),
    isInFinale,
    isShowOver: currentRoundIdx === -1 && totalPlayed > 0,
  };
}

// ============================================================
// APP
// ============================================================

function App() {
  const [roster, setRoster] = useState(SEED_PLAYERS);
  const [tonightCast, setTonightCast] = useState([]);
  const [filterMode, setFilterMode] = useState('hard');
  const [selectedTags, setSelectedTags] = useState([]);
  const [view, setView] = useState('director');
  const [selectedGame, setSelectedGame] = useState(null);
  const [search, setSearch] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [format, setFormat] = useState(DEFAULT_FORMAT);
  const [playedGameIds, setPlayedGameIds] = useState([]);
  const [customPrefs, setCustomPrefs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setRoster(await loadKey(KEY_ROSTER, SEED_PLAYERS));
      const session = await loadKey(KEY_SESSION, { tonightCast: [], mode: 'hard', selectedTags: [] });
      setTonightCast(session.tonightCast || []);
      setFilterMode(session.mode || 'hard');
      setSelectedTags(session.selectedTags || []);
      setFormat(await loadKey(KEY_FORMAT, DEFAULT_FORMAT));
      setPlayedGameIds(await loadKey(KEY_PLAYED, []));
      setCustomPrefs(await loadKey(KEY_CUSTOM_PREFS, []));
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) saveKey(KEY_ROSTER, roster); }, [roster, loaded]);
  useEffect(() => {
    if (loaded) saveKey(KEY_SESSION, { tonightCast, mode: filterMode, selectedTags });
  }, [tonightCast, filterMode, selectedTags, loaded]);
  useEffect(() => { if (loaded) saveKey(KEY_FORMAT, format); }, [format, loaded]);
  useEffect(() => { if (loaded) saveKey(KEY_PLAYED, playedGameIds); }, [playedGameIds, loaded]);
  useEffect(() => { if (loaded) saveKey(KEY_CUSTOM_PREFS, customPrefs); }, [customPrefs, loaded]);

  const allPrefs = useMemo(() => [...BUILTIN_PREFERENCES, ...customPrefs], [customPrefs]);

  const evaluatedGames = useMemo(() => {
    return GAMES.map(g => ({
      ...g,
      evaluation: evaluateGame(g, tonightCast, allPrefs),
      shapeReasons: evaluateShapeOfShow(g, playedGameIds),
    }));
  }, [tonightCast, playedGameIds, allPrefs]);

  const showProgress = useMemo(() => getShowProgress(format, playedGameIds, tonightCast),
    [format, playedGameIds, tonightCast]);

  const hasActiveFilters = selectedTags.length > 0 || search.trim().length > 0;

  const filteredGames = useMemo(() => {
    if (!hasActiveFilters) return [];
    let games = evaluatedGames;
    if (search) {
      const q = search.toLowerCase();
      games = games.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    if (selectedTags.length > 0) {
      games = games.filter(g => selectedTags.every(t => g.tags.includes(t)));
    }
    if (filterMode === 'hard') {
      games = games.filter(g => g.evaluation.conflicts.length === 0);
    }
    return games;
  }, [evaluatedGames, search, filterMode, selectedTags, hasActiveFilters]);

  const { recommended, notRecommended } = useMemo(() => {
    const rec = [], nrec = [];
    for (const g of filteredGames) {
      if (g.shapeReasons.length > 0) nrec.push(g);
      else rec.push(g);
    }
    return { recommended: rec, notRecommended: nrec };
  }, [filteredGames]);

  const recommendedByPlayerTag = useMemo(() => {
    const out = {};
    for (const t of PLAYER_TAGS) out[t] = [];
    for (const g of recommended) {
      const matched = PLAYER_TAGS.filter(t => g.tags.includes(t));
      for (const t of matched) out[t].push(g);
    }
    // Sort each bucket: good fits first (by unique-player boost count desc),
    // then neutral games, then games with soft conflicts (shown only in soft mode).
    // Within the same tier, preserve original order (which is roughly Maestro-running-order grouping).
    for (const t of PLAYER_TAGS) {
      out[t] = [...out[t]].map((g, idx) => {
        const uniqueBoostPlayers = new Set((g.evaluation?.boosts || []).map(b => b.playerId)).size;
        const hasConflict = (g.evaluation?.conflicts || []).length > 0;
        // Tier: 0 = good fit, 1 = neutral, 2 = soft conflict
        let tier = 1;
        if (uniqueBoostPlayers > 0 && !hasConflict) tier = 0;
        else if (hasConflict) tier = 2;
        return { game: g, tier, boostScore: uniqueBoostPlayers, origIdx: idx };
      })
      .sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        if (a.tier === 0 && b.boostScore !== a.boostScore) return b.boostScore - a.boostScore;
        return a.origIdx - b.origIdx;
      })
      .map(x => x.game);
    }
    return out;
  }, [recommended]);

  function addRosterPlayer() {
    const newPlayer = { id: 'p_' + Date.now(), name: 'New Player', preferences: [], notes: '' };
    setRoster(prev => [...prev, newPlayer]);
    setEditingPlayer(newPlayer.id);
  }
  function updateRosterPlayer(id, updates) {
    setRoster(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    setTonightCast(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }
  function deleteRosterPlayer(id) {
    setRoster(prev => prev.filter(p => p.id !== id));
    // Also remove from tonight's cast if they're on stage
    setTonightCast(prev => prev.filter(p => p.id !== id).map((p, i) => ({ ...p, playerNumber: i + 1 })));
  }
  function toggleRosterPref(playerId, prefId) {
    const player = roster.find(p => p.id === playerId);
    if (!player) return;
    const newPrefs = (player.preferences || []).includes(prefId)
      ? player.preferences.filter(p => p !== prefId)
      : [...(player.preferences || []), prefId];
    updateRosterPlayer(playerId, { preferences: newPrefs });
  }
  function addCustomPref(label, kind, flagTags, boostTags) {
    const id = 'custom_' + Date.now();
    const newPref = { id, label: label.trim(), kind, custom: true };
    if (kind === 'dislike' && flagTags && flagTags.length > 0) newPref.flagTags = flagTags;
    if (kind === 'like' && boostTags && boostTags.length > 0) newPref.boostTags = boostTags;
    setCustomPrefs(prev => [...prev, newPref]);
  }
  function deleteCustomPref(prefId) {
    setCustomPrefs(prev => prev.filter(p => p.id !== prefId));
    // Also clean references from all players
    setRoster(prev => prev.map(p => ({
      ...p, preferences: (p.preferences || []).filter(pid => pid !== prefId),
    })));
    setTonightCast(prev => prev.map(p => ({
      ...p, preferences: (p.preferences || []).filter(pid => pid !== prefId),
    })));
  }

  function addToTonight(playerId) {
    const p = roster.find(r => r.id === playerId);
    if (!p || tonightCast.some(t => t.id === playerId)) return;
    const nextNumber = (tonightCast.reduce((m, c) => Math.max(m, c.playerNumber || 0), 0) || 0) + 1;
    setTonightCast(prev => [...prev, { ...p, playerNumber: nextNumber }]);
  }
  function removeFromTonight(playerId) {
    setTonightCast(prev => prev.filter(p => p.id !== playerId).map((p, i) => ({ ...p, playerNumber: i + 1 })));
  }
  function addAdHocPlayer(name) {
    if (!name.trim()) return;
    const nextNumber = (tonightCast.reduce((m, c) => Math.max(m, c.playerNumber || 0), 0) || 0) + 1;
    setTonightCast(prev => [...prev, {
      id: 'adhoc_' + Date.now(), name: name.trim(), preferences: [], notes: '', playerNumber: nextNumber,
    }]);
  }
  function updateTonightPlayer(id, updates) {
    setTonightCast(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }
  function toggleTonightPref(playerId, prefId) {
    const player = tonightCast.find(p => p.id === playerId);
    if (!player) return;
    const newPrefs = (player.preferences || []).includes(prefId)
      ? player.preferences.filter(p => p !== prefId)
      : [...(player.preferences || []), prefId];
    updateTonightPlayer(playerId, { preferences: newPrefs });
  }
  function resetTonight() { setTonightCast([]); }

  function toggleTag(tag) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }
  function clearTags() { setSelectedTags([]); }

  function selectGameById(gameId) {
    const g = evaluatedGames.find(x => x.id === gameId);
    if (g) { setSelectedGame(g); setView('director'); }
  }

  function togglePlayed(gameId) {
    const isAlreadyPlayed = playedGameIds.includes(gameId);
    if (isAlreadyPlayed) {
      // Remove from played list AND clear any format slot it occupies
      setPlayedGameIds(prev => prev.filter(id => id !== gameId));
      setFormat(prev => ({
        ...prev,
        rounds: prev.rounds.map(r => ({
          ...r,
          games: r.games.map(g => g.gameId === gameId ? { ...g, gameId: null } : g),
        })),
      }));
    } else {
      // Add to played list AND assign to best available format slot
      setPlayedGameIds(prev => [...prev, gameId]);
      const game = GAMES.find(g => g.id === gameId);
      if (game) {
        const slot = findBestSlotForGame(game, format, playedGameIds);
        if (slot) {
          setFormat(prev => ({
            ...prev,
            rounds: prev.rounds.map((r, rIdx) => {
              if (rIdx !== slot.roundIdx) return r;
              return {
                ...r,
                games: r.games.map((g, gIdx) => gIdx === slot.slotIdx ? { ...g, gameId } : g),
              };
            }),
          }));
        }
      }
    }
  }
  function resetPlayed() {
    setPlayedGameIds([]);
    // Also clear all slot assignments
    setFormat(prev => ({
      ...prev,
      rounds: prev.rounds.map(r => ({
        ...r,
        games: r.games.map(g => ({ ...g, gameId: null })),
      })),
    }));
  }
  function resetFormat() { setFormat(DEFAULT_FORMAT); }
  function generateFormatFromCurrentCast() {
    if (tonightCast.length === 0) return;
    const skeleton = generateFormatFromCast(tonightCast, allPrefs);
    // Backfill any games already in playedGameIds into the new skeleton
    let working = skeleton;
    for (const gid of playedGameIds) {
      const game = GAMES.find(g => g.id === gid);
      if (!game) continue;
      const slot = findBestSlotForGame(game, working, []);
      if (slot) {
        working = {
          ...working,
          rounds: working.rounds.map((r, rIdx) => {
            if (rIdx !== slot.roundIdx) return r;
            return {
              ...r,
              games: r.games.map((g, gIdx) => gIdx === slot.slotIdx ? { ...g, gameId: gid } : g),
            };
          }),
        };
      }
    }
    setFormat(working);
  }

  return (
    <div className="min-h-screen" style={{
      background: 'radial-gradient(ellipse at top, #1e3a5f 0%, #15294a 40%, #0a1628 100%)',
      color: '#ffffff',
      fontFamily: '"Crimson Pro", Georgia, serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap');
        .display-font { font-family: 'Bebas Neue', Impact, sans-serif; letter-spacing: 0.04em; }
        .mono-font { font-family: 'JetBrains Mono', monospace; }
        .stage-light { background: radial-gradient(circle at 50% 0%, rgba(247, 178, 35, 0.12) 0%, transparent 70%); }
        .game-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .game-card:hover { transform: translateY(-2px); }
        .conflict-border { border-left: 4px solid #e85d4f; }
        .boost-border { border-left: 4px solid #f7b223; }
        .clean-border { border-left: 4px solid #2a4970; }
        .shape-border { border-left: 4px solid #8a7a3a; }
        .pref-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; margin: 2px; border-radius: 3px; font-size: 12px;
          background: #15294a; border: 1px solid #2a4970; cursor: pointer;
          transition: all 0.1s; color: #ffffff; line-height: 1.2;
        }
        .pref-chip-like.active { background: #4ade80; border-color: #4ade80; color: #0a1628; font-weight: 600; }
        .pref-chip-dislike.active { background: #ef4444; border-color: #ef4444; color: #ffffff; font-weight: 600; }
        .pref-chip:hover { border-color: #f7b223; }
        .pref-chip-add {
          background: transparent; border: 1px dashed #f7b223; color: #f7b223;
        }
        .pref-chip-add:hover { background: rgba(247, 178, 35, 0.1); }
        .tag-pill {
          display: inline-flex; align-items: center; padding: 5px 12px; margin: 3px;
          font-size: 12px; background: transparent; border: 1px solid #2a4970;
          color: #b8d4f0; cursor: pointer; transition: all 0.1s;
          letter-spacing: 0.04em; font-family: 'JetBrains Mono', monospace;
        }
        .tag-pill:hover { border-color: #f7b223; color: #f7b223; }
        .tag-pill.active { background: #f7b223; color: #0a1628; border-color: #f7b223; font-weight: 600; }
        .tag-pill.player-tag.active { background: #e85d4f; border-color: #e85d4f; color: #ffffff; }
        .tag-pill.suggested {
          border-color: #4ade80;
          color: #4ade80;
          box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.4);
        }
        .tag-pill.suggested:hover {
          background: #4ade80;
          color: #0a1628;
          border-color: #4ade80;
        }
        .btn {
          padding: 8px 14px; font-family: 'JetBrains Mono', monospace; font-size: 12px;
          letter-spacing: 0.08em; font-weight: 600; cursor: pointer; transition: all 0.1s;
          background: transparent; color: #f7b223; border: 1px solid #f7b223;
        }
        .btn:hover { background: #f7b223; color: #0a1628; }
        .btn-primary { background: #f7b223; color: #0a1628; }
        .btn-primary:hover { background: #ffc744; }
        .btn-danger { color: #e85d4f; border-color: #e85d4f; }
        .btn-danger:hover { background: #e85d4f; color: #ffffff; }
        .btn-success { color: #4ade80; border-color: #4ade80; }
        .btn-success:hover { background: #4ade80; color: #0a1628; }
        .panel { background: #15294a; border: 1px solid #2a4970; }
        .label-dim { color: #b8d4f0; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a1628; }
        ::-webkit-scrollbar-thumb { background: #2a4970; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a5980; }

        /* Mobile-friendly tap targets and sticky behavior */
        @media (min-width: 1024px) {
          .lg-sticky { position: sticky; top: 20px; }
        }
        @media (max-width: 1023px) {
          .lg-sticky { position: relative; }
          .btn { min-height: 40px; padding: 10px 14px; }
          .pref-chip { padding: 6px 10px; font-size: 13px; min-height: 32px; }
          .tag-pill { padding: 7px 14px; font-size: 13px; min-height: 32px; }
        }
        @media (max-width: 640px) {
          .app-title { font-size: 24px !important; line-height: 1.1 !important; }
          .app-header-pad { padding: 14px 16px !important; }
          .display-font-responsive { font-size: 20px !important; }
        }

        /* Print styles - hide everything except the print sheet */
        .print-only { display: none; }
        @media print {
          @page {
            margin: 0.5in;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
          .print-only {
            display: block !important;
            background: white !important;
            color: black !important;
            font-family: Georgia, 'Times New Roman', serif;
            padding: 0;
          }
          .print-only * {
            color: black !important;
            background: white !important;
            border-color: #333 !important;
          }
          .print-only .print-accent {
            color: #555 !important;
            font-weight: 600;
          }
          .print-only .print-strike {
            text-decoration: line-through;
            color: #888 !important;
          }
          .print-only h1 {
            font-size: 22pt;
            margin: 0 0 6pt 0;
            font-family: Georgia, serif;
            font-weight: 700;
          }
          .print-only h2 {
            font-size: 14pt;
            margin: 14pt 0 6pt 0;
            border-bottom: 2pt solid #333;
            padding-bottom: 2pt;
          }
          .print-only h3 {
            font-size: 12pt;
            margin: 10pt 0 4pt 0;
          }
          .print-only .print-subtitle {
            font-size: 10pt;
            font-style: italic;
            margin-bottom: 12pt;
          }
          .print-only .print-round {
            margin: 8pt 0 16pt 0;
            page-break-inside: avoid;
          }
          .print-only .print-slot {
            padding: 5pt 0;
            border-bottom: 0.5pt solid #ccc !important;
            font-size: 11pt;
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12pt;
          }
          .print-only .print-slot-num {
            font-size: 9pt;
            color: #666 !important;
            min-width: 50pt;
          }
          .print-only .print-slot-name {
            flex: 1;
            font-weight: 600;
          }
          .print-only .print-slot-meta {
            font-size: 9pt;
            color: #666 !important;
            white-space: nowrap;
          }
          .print-only .print-slot-reason {
            font-size: 9pt;
            color: #555 !important;
            font-style: italic;
            margin-top: 1pt;
          }
          .print-only .print-eliminate {
            margin-top: 6pt;
            padding: 4pt 8pt;
            border: 1pt solid #d00 !important;
            color: #d00 !important;
            font-weight: 600;
            font-size: 10pt;
            display: inline-block;
          }
          .print-only .print-cast-list {
            columns: 2;
            column-gap: 24pt;
            font-size: 10pt;
            margin: 4pt 0;
          }
          .print-only .print-cast-list .print-cast-item {
            break-inside: avoid;
            padding: 2pt 0;
          }
          .print-only .print-cast-prefs {
            font-size: 8pt;
            color: #555 !important;
            font-style: italic;
            margin-left: 14pt;
          }
          .print-only .print-stage-size {
            font-size: 10pt;
            color: #333 !important;
            margin-left: 8pt;
          }
          .print-only .print-footer {
            margin-top: 18pt;
            padding-top: 6pt;
            border-top: 0.5pt solid #ccc;
            font-size: 9pt;
            color: #666 !important;
            font-style: italic;
          }
        }
      `}</style>

      <header className="stage-light no-print" style={{ borderBottom: '1px solid #2a4970' }}>
        <div className="max-w-7xl mx-auto app-header-pad flex items-center justify-between flex-wrap gap-3" style={{ padding: '20px 24px' }}>
          <div>
            <h1 className="display-font app-title" style={{ fontSize: '36px', color: '#f7b223', lineHeight: 1 }}>
              Maestro Director&apos;s Helper
            </h1>
          </div>
          <nav className="flex gap-2 flex-wrap">
            <button onClick={() => setView('director')} className="btn"
              style={{ background: view === 'director' ? '#f7b223' : 'transparent', color: view === 'director' ? '#0a1628' : '#f7b223' }}>GAMES</button>
            <button onClick={() => setView('roster')} className="btn"
              style={{ background: view === 'roster' ? '#f7b223' : 'transparent', color: view === 'roster' ? '#0a1628' : '#f7b223' }}>ROSTER</button>
            <button onClick={() => setView('format')} className="btn"
              style={{ background: view === 'format' ? '#f7b223' : 'transparent', color: view === 'format' ? '#0a1628' : '#f7b223' }}>FORMAT</button>
          </nav>
        </div>
      </header>

      <div className="no-print">
        {view === 'director' && (
          <DirectorView
          tonightCast={tonightCast} goToCastSetup={() => setView('cast_setup')}
          filterMode={filterMode} setFilterMode={setFilterMode}
          selectedTags={selectedTags} setSelectedTags={setSelectedTags} toggleTag={toggleTag} clearTags={clearTags}
          hasActiveFilters={hasActiveFilters}
          recommendedByPlayerTag={recommendedByPlayerTag} notRecommended={notRecommended}
          selectedGame={selectedGame} setSelectedGame={setSelectedGame}
          search={search} setSearch={setSearch}
          playedGameIds={playedGameIds} togglePlayed={togglePlayed}
          allPrefs={allPrefs}
          showProgress={showProgress}
        />
      )}

      {view === 'format' && (
        <FormatView
          format={format} setFormat={setFormat} resetFormat={resetFormat}
          playedGameIds={playedGameIds} togglePlayed={togglePlayed} resetPlayed={resetPlayed}
          selectGameById={selectGameById}
          tonightCast={tonightCast}
          allPrefs={allPrefs}
          generateFormatFromCurrentCast={generateFormatFromCurrentCast}
          goToCastSetup={() => setView('cast_setup')}
        />
      )}

      {view === 'cast_setup' && (
        <CastSetupView
          roster={roster} tonightCast={tonightCast}
          addToTonight={addToTonight} removeFromTonight={removeFromTonight}
          addAdHocPlayer={addAdHocPlayer} updateTonightPlayer={updateTonightPlayer}
          toggleTonightPref={toggleTonightPref} resetTonight={resetTonight}
          goBack={() => setView('director')}
          allPrefs={allPrefs}
        />
      )}

      {view === 'roster' && (
        <RosterView
          roster={roster} updatePlayer={updateRosterPlayer}
          deletePlayer={deleteRosterPlayer} addPlayer={addRosterPlayer}
          togglePlayerPref={toggleRosterPref}
          editingPlayer={editingPlayer} setEditingPlayer={setEditingPlayer}
          allPrefs={allPrefs} customPrefs={customPrefs}
          addCustomPref={addCustomPref} deleteCustomPref={deleteCustomPref}
        />
      )}
      </div>

      <PrintableFormat
        format={format}
        tonightCast={tonightCast}
        playedGameIds={playedGameIds}
        allPrefs={allPrefs}
      />
    </div>
  );
}

// ============================================================
// PREFERENCE CHIP HELPER
// ============================================================

function PrefChip({ pref, isOn, onClick, onDelete }) {
  const kindClass = pref.kind === 'like' ? 'pref-chip-like' : 'pref-chip-dislike';
  return (
    <span onClick={onClick} className={`pref-chip ${kindClass} ${isOn ? 'active' : ''}`}>
      {pref.kind === 'like' ? <Heart size={10} /> : <HeartOff size={10} />}
      {pref.label}
      {pref.custom && onDelete && (
        <span onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
          marginLeft: '4px', cursor: 'pointer', opacity: 0.6,
        }}>×</span>
      )}
    </span>
  );
}

// ============================================================
// DIRECTOR VIEW
// ============================================================

function DirectorView({ tonightCast, goToCastSetup, filterMode, setFilterMode, selectedTags, setSelectedTags, toggleTag, clearTags, hasActiveFilters, recommendedByPlayerTag, notRecommended, selectedGame, setSelectedGame, search, setSearch, playedGameIds, togglePlayed, allPrefs, showProgress }) {
  const [progressCollapsed, setProgressCollapsed] = useState(false);

  function applyPlayerCountSuggestion() {
    if (!showProgress.suggestedPlayerCount) return;
    // Replace any existing player-count tag with the suggested one
    const playerCountTags = ['2 players', '3 players', '4 players', '5+ players', 'Solo scene'];
    const newTags = selectedTags.filter(t => !playerCountTags.includes(t));
    newTags.push(showProgress.suggestedPlayerCount);
    setSelectedTags(newTags);
  }

  function applyStyleSuggestion(styleTag) {
    if (!styleTag || selectedTags.includes(styleTag)) return;
    setSelectedTags([...selectedTags, styleTag]);
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      <aside className="lg:col-span-3 order-1">
        <div className="lg-sticky">
          <h2 className="display-font" style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
            Tonight&apos;s Cast
          </h2>
          <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '16px' }}>
            {tonightCast.length} ON STAGE
          </p>

          {tonightCast.length === 0 ? (
            <div className="panel" style={{ padding: '16px', textAlign: 'center', marginBottom: '12px', borderStyle: 'dashed' }}>
              <Users size={20} className="label-dim" style={{ margin: '0 auto 8px' }} />
              <p className="label-dim" style={{ fontSize: '13px', marginBottom: '12px' }}>No cast set up for tonight yet.</p>
              <button onClick={goToCastSetup} className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                SET UP TONIGHT&apos;S CAST
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1 mb-3">
                {tonightCast.sort((a, b) => (a.playerNumber || 0) - (b.playerNumber || 0)).map(player => (
                  <div key={player.id} style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #15294a 100%)',
                    border: '1px solid #f7b223', padding: '8px 12px', fontSize: '14px', color: '#ffffff',
                  }}>
                    <div className="flex items-center gap-2">
                      <span className="mono-font" style={{
                        fontSize: '11px', background: '#f7b223', color: '#0a1628',
                        padding: '2px 6px', fontWeight: 700,
                      }}>P{player.playerNumber}</span>
                      <span style={{ fontWeight: 600 }}>{player.name}</span>
                    </div>
                    {player.preferences.length > 0 && (
                      <div className="mt-1 flex flex-wrap" style={{ gap: '2px' }}>
                        {player.preferences.map(pid => {
                          const p = allPrefs.find(pr => pr.id === pid);
                          if (!p) return null;
                          const color = p.kind === 'like' ? '#4ade80' : '#ef4444';
                          return (
                            <span key={pid} style={{
                              fontSize: '10px', color, fontWeight: 600,
                              padding: '1px 5px', borderRadius: '2px',
                              border: `1px solid ${color}`, opacity: 0.9,
                            }}>{p.label}</span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={goToCastSetup} className="btn" style={{ width: '100%' }}>
                <Edit2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                CHANGE PLAYERS
              </button>
            </>
          )}

          <div style={{ borderTop: '1px solid #2a4970', paddingTop: '16px', marginTop: '16px' }}>
            <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px' }}>
              FILTER MODE
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setFilterMode('hard')} className="text-left px-3 py-2" style={{
                background: filterMode === 'hard' ? '#e85d4f' : '#15294a',
                border: `1px solid ${filterMode === 'hard' ? '#e85d4f' : '#2a4970'}`,
                color: '#ffffff', fontSize: '13px', cursor: 'pointer',
              }}>
                <div className="flex items-center gap-2">
                  <EyeOff size={14} />
                  <span style={{ fontWeight: filterMode === 'hard' ? 600 : 400 }}>Hide conflicting games</span>
                </div>
              </button>
              <button onClick={() => setFilterMode('soft')} className="text-left px-3 py-2" style={{
                background: filterMode === 'soft' ? '#f7b223' : '#15294a',
                color: filterMode === 'soft' ? '#0a1628' : '#ffffff',
                border: `1px solid ${filterMode === 'soft' ? '#f7b223' : '#2a4970'}`,
                fontSize: '13px', cursor: 'pointer',
              }}>
                <div className="flex items-center gap-2">
                  <Eye size={14} />
                  <span style={{ fontWeight: filterMode === 'soft' ? 600 : 400 }}>Show all, flag conflicts</span>
                </div>
              </button>
            </div>
          </div>

          {playedGameIds.length > 0 && (
            <div style={{ borderTop: '1px solid #2a4970', paddingTop: '16px', marginTop: '16px' }}>
              <p className="mono-font" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px', color: '#f7b223' }}>
                PLAYED TONIGHT · {playedGameIds.length}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px 0' }}>
                {playedGameIds.map((gid, i) => {
                  const game = GAMES.find(g => g.id === gid);
                  if (!game) return null;
                  return (
                    <li key={gid + '_' + i} style={{
                      fontSize: '13px',
                      color: '#ffffff',
                      padding: '4px 8px',
                      marginBottom: '3px',
                      background: '#0a1628',
                      border: '1px solid #15294a',
                      borderLeft: '3px solid #f7b223',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <CheckCircle2 size={12} style={{ color: '#f7b223', flexShrink: 0 }} />
                      <button onClick={() => setSelectedGame(game)} style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#ffffff', fontSize: '13px',
                        textAlign: 'left', cursor: 'pointer',
                        flex: 1, fontFamily: 'inherit',
                        textDecoration: 'line-through',
                        textDecorationColor: '#7a92b8',
                      }}>
                        {i + 1}. {game.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="label-dim" style={{ fontSize: '11px', lineHeight: 1.4, fontStyle: 'italic' }}>
                Similar games move to &ldquo;not recommended&rdquo; in the list below.
              </p>
            </div>
          )}
        </div>
      </aside>

      <main className="lg:col-span-5 order-3 lg:order-2">
        {tonightCast.length > 0 && (showProgress.totalPlayed > 0 || showProgress.suggestedPlayerCount) && (
          <ShowProgressPanel
            progress={showProgress}
            castSize={tonightCast.length}
            collapsed={progressCollapsed}
            setCollapsed={setProgressCollapsed}
            onApplyPlayerCount={applyPlayerCountSuggestion}
            onApplyStyle={applyStyleSuggestion}
            selectedTags={selectedTags}
          />
        )}

        <div className="mb-4">
          <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>
            FILTER BY PLAYERS
          </p>
          <div className="mb-2">
            {PLAYER_TAGS.map(tag => {
              const isSuggested = showProgress.suggestedPlayerCount === tag && !selectedTags.includes(tag);
              return (
                <span key={tag} onClick={() => toggleTag(tag)}
                  className={`tag-pill player-tag ${selectedTags.includes(tag) ? 'active' : ''} ${isSuggested ? 'suggested' : ''}`}>
                  {isSuggested && <span style={{ marginRight: '4px' }}>→</span>}{tag}
                </span>
              );
            })}
          </div>
          {showProgress.suggestedPlayerCount && !selectedTags.includes(showProgress.suggestedPlayerCount) && (
            <p style={{ fontSize: '11px', color: '#4ade80', fontStyle: 'italic', marginTop: '-2px', marginBottom: '4px' }}>
              suggestion based on where you are in the show
            </p>
          )}
          <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px', marginTop: '10px' }}>
            FILTER BY STYLE
          </p>
          <div>
            {DESCRIPTIVE_TAGS.map(tag => {
              const isSuggested = showProgress.styleHints.some(h => h.tag === tag) && !selectedTags.includes(tag);
              return (
                <span key={tag} onClick={() => toggleTag(tag)}
                  className={`tag-pill ${selectedTags.includes(tag) ? 'active' : ''} ${isSuggested ? 'suggested' : ''}`}>
                  {isSuggested && <span style={{ marginRight: '4px' }}>→</span>}{tag}
                </span>
              );
            })}
          </div>
          {showProgress.styleHints.some(h => h.tag && !selectedTags.includes(h.tag)) && (
            <p style={{ fontSize: '11px', color: '#4ade80', fontStyle: 'italic', marginTop: '4px', marginBottom: '4px' }}>
              suggestion based on what&apos;s been played
            </p>
          )}
          {selectedTags.length > 0 && (
            <button onClick={clearTags} className="mono-font label-dim" style={{
              fontSize: '11px', marginTop: '8px', textDecoration: 'underline',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            }}>clear filters ({selectedTags.length})</button>
          )}
        </div>

        <div className="mb-4 relative">
          <Search size={14} className="label-dim" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games..." className="w-full pl-9 pr-3 py-2"
            style={{ background: '#15294a', border: '1px solid #2a4970', color: '#ffffff', fontSize: '14px', fontFamily: 'inherit' }} />
        </div>

        {!hasActiveFilters && (
          <div className="panel" style={{ padding: '32px 24px', textAlign: 'center', borderStyle: 'dashed' }}>
            <p className="display-font" style={{ fontSize: '20px', color: '#f7b223', marginBottom: '8px' }}>
              Select a Filter to Begin
            </p>
            <p className="label-dim" style={{ fontSize: '14px', lineHeight: 1.5 }}>
              Pick player counts, style tags, or type in the search box to find games.
              Set up tonight&apos;s cast on the left to also flag conflicts and good fits.
            </p>
          </div>
        )}

        {hasActiveFilters && PLAYER_TAGS.map(tag => {
          const games = recommendedByPlayerTag[tag];
          if (!games || games.length === 0) return null;
          // If the user has selected any player-count tags explicitly, only show those sections.
          // This stops a game tagged with both "4 players" and "5+ players" from appearing in
          // both buckets when the user filtered for one specific count.
          const selectedPlayerTags = selectedTags.filter(t => PLAYER_TAGS.includes(t));
          if (selectedPlayerTags.length > 0 && !selectedPlayerTags.includes(tag)) return null;
          return (
            <section key={tag} className="mb-6">
              <h3 className="display-font" style={{ fontSize: '18px', color: '#f7b223', marginBottom: '8px', borderBottom: '1px solid #2a4970', paddingBottom: '4px' }}>
                {tag.toUpperCase()} <span className="mono-font label-dim" style={{ fontSize: '12px' }}>· {games.length}</span>
              </h3>
              <div className="space-y-2">
                {games.map(game => (
                  <GameRow key={game.id + '_' + tag} game={game}
                    selectedGame={selectedGame} setSelectedGame={setSelectedGame}
                    isPlayed={playedGameIds.includes(game.id)}
                    onTogglePlayed={() => togglePlayed(game.id)} />
                ))}
              </div>
            </section>
          );
        })}

        {hasActiveFilters && notRecommended.length > 0 && (
          <section className="mb-6" style={{ borderTop: '2px dashed #8a7a3a', paddingTop: '20px', marginTop: '20px' }}>
            <h3 className="display-font" style={{ fontSize: '18px', color: '#d4a83f', marginBottom: '4px' }}>
              NOT RECOMMENDED RIGHT NOW
              <span className="mono-font label-dim" style={{ fontSize: '12px', marginLeft: '8px' }}>· {notRecommended.length}</span>
            </h3>
            <p className="label-dim" style={{ fontSize: '12px', fontStyle: 'italic', marginBottom: '10px' }}>
              These games conflict with the shape of the show so far (too similar to something already played, or already played themselves).
            </p>
            <div className="space-y-2">
              {notRecommended.map(game => (
                <GameRow key={'nrec_' + game.id} game={game}
                  selectedGame={selectedGame} setSelectedGame={setSelectedGame}
                  isPlayed={playedGameIds.includes(game.id)}
                  onTogglePlayed={() => togglePlayed(game.id)} showShapeWarning />
              ))}
            </div>
          </section>
        )}

        {hasActiveFilters && Object.values(recommendedByPlayerTag).every(g => g.length === 0) && notRecommended.length === 0 && (
          <div className="panel" style={{ padding: '24px', textAlign: 'center', borderStyle: 'dashed' }}>
            <p className="label-dim">No games match the current filters.</p>
          </div>
        )}
      </main>

      <aside className="lg:col-span-4 order-2 lg:order-3 hidden lg:block">
        <div style={{ position: 'sticky', top: '20px' }}>
          {selectedGame ? (
            <GameDetail game={selectedGame} tonightCast={tonightCast}
              onClose={() => setSelectedGame(null)}
              isPlayed={playedGameIds.includes(selectedGame.id)}
              onTogglePlayed={() => togglePlayed(selectedGame.id)}
              allPrefs={allPrefs} />
          ) : (
            <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
              <p className="mono-font label-dim" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>SELECT A GAME</p>
              <p className="label-dim" style={{ fontSize: '13px', marginTop: '8px' }}>
                Tap any game to see its description and delivery script.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile-only: full-screen overlay for selected game */}
      {selectedGame && (
        <div className="lg:hidden" onClick={() => setSelectedGame(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 22, 40, 0.85)', zIndex: 900,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '12px', overflowY: 'auto',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: '600px', maxHeight: '95vh', overflowY: 'auto',
          }}>
            <GameDetail game={selectedGame} tonightCast={tonightCast}
              onClose={() => setSelectedGame(null)}
              isPlayed={playedGameIds.includes(selectedGame.id)}
              onTogglePlayed={() => togglePlayed(selectedGame.id)}
              allPrefs={allPrefs} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SHOW PROGRESS PANEL
// ============================================================

function ShowProgressPanel({ progress, castSize, collapsed, setCollapsed, onApplyPlayerCount, onApplyStyle, selectedTags }) {
  const {
    currentRound, totalPlayed, gamesPlayedInRound, hasFormatGuide,
    suggestedPlayerCount, suggestedPlayerCountReason, styleHints, structuralHints, isInFinale,
  } = progress;

  const headerText = currentRound
    ? `Round ${currentRound.number}${gamesPlayedInRound > 0 ? ` · ${gamesPlayedInRound} of ${currentRound.games.length || '?'} played` : ' · just starting'}`
    : (totalPlayed > 0 ? 'Show in progress' : 'Ready to start');

  const subText = currentRound
    ? `${currentRound.playersOnStage} on stage${currentRound.eliminate > 0 ? ` · eliminate ${currentRound.eliminate} after this round` : ''}`
    : `${castSize} player${castSize !== 1 ? 's' : ''} ready`;

  const playerCountAlreadyApplied = suggestedPlayerCount && selectedTags.includes(suggestedPlayerCount);

  if (collapsed) {
    return (
      <div onClick={() => setCollapsed(false)} style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #15294a 100%)',
        border: '1px solid #4ade80',
        padding: '10px 14px',
        marginBottom: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <div className="flex items-center gap-2" style={{ flex: 1 }}>
          <CheckCircle2 size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
          <span className="mono-font" style={{ fontSize: '12px', color: '#ffffff', letterSpacing: '0.04em' }}>
            {headerText.toUpperCase()}
          </span>
          {suggestedPlayerCount && (
            <span className="mono-font" style={{ fontSize: '11px', color: '#4ade80', letterSpacing: '0.04em' }}>
              · TRY {suggestedPlayerCount.toUpperCase()}
            </span>
          )}
        </div>
        <ChevronDown size={14} style={{ color: '#b8d4f0' }} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e3a5f 0%, #15294a 100%)',
      border: '1px solid #4ade80',
      padding: '14px 16px',
      marginBottom: '14px',
    }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
            <p className="display-font" style={{ fontSize: '18px', color: '#ffffff', lineHeight: 1 }}>
              {headerText}
            </p>
          </div>
          <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.08em', marginTop: '4px', marginLeft: '24px' }}>
            {subText.toUpperCase()}
          </p>
        </div>
        <button onClick={() => setCollapsed(true)} style={{
          background: 'none', border: 'none', color: '#b8d4f0', cursor: 'pointer', padding: '4px',
        }} title="Collapse">
          <ChevronUp size={16} />
        </button>
      </div>

      {/* Suggested next game */}
      {suggestedPlayerCount && (
        <div style={{
          background: 'rgba(74, 222, 128, 0.08)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          padding: '10px 12px',
          marginTop: '10px',
        }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div style={{ flex: 1, minWidth: '180px' }}>
              <p className="mono-font" style={{ fontSize: '10px', color: '#4ade80', letterSpacing: '0.1em', marginBottom: '3px' }}>
                NEXT UP
              </p>
              <p style={{ fontSize: '15px', color: '#ffffff', fontWeight: 600, lineHeight: 1.3 }}>
                Try a <strong style={{ color: '#4ade80' }}>{suggestedPlayerCount}</strong> scene
              </p>
              <p className="label-dim" style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '2px' }}>
                {suggestedPlayerCountReason}
              </p>
            </div>
            {!playerCountAlreadyApplied && (
              <button onClick={onApplyPlayerCount} className="btn"
                style={{ background: '#4ade80', color: '#0a1628', borderColor: '#4ade80', fontSize: '11px', padding: '6px 12px' }}>
                FILTER TO IT
              </button>
            )}
          </div>
        </div>
      )}

      {/* Style hints */}
      {styleHints.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <p className="mono-font label-dim" style={{ fontSize: '10px', letterSpacing: '0.1em', marginBottom: '6px' }}>
            STYLE TIPS
          </p>
          {styleHints.slice(0, 3).map((hint, i) => (
            <div key={i} style={{
              fontSize: '13px', color: '#b8d4f0', padding: '4px 0',
              display: 'flex', alignItems: 'flex-start', gap: '6px',
            }}>
              <span style={{ color: '#f7b223', flexShrink: 0, marginTop: '2px' }}>•</span>
              <div style={{ flex: 1 }}>
                {hint.reason}
                {hint.tag && !selectedTags.includes(hint.tag) && (
                  <button onClick={() => onApplyStyle(hint.tag)} style={{
                    marginLeft: '8px', background: 'transparent', border: '1px solid #4ade80',
                    color: '#4ade80', padding: '1px 8px', fontSize: '10px', cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
                  }}>
                    + {hint.tag.toUpperCase()}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structural advice */}
      {structuralHints.length > 0 && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="mono-font" style={{ fontSize: '10px', color: '#f7b223', letterSpacing: '0.1em', marginBottom: '6px' }}>
            STRUCTURE
          </p>
          {structuralHints.map((hint, i) => (
            <div key={i} style={{
              fontSize: '13px', padding: '3px 0',
              color: hint.kind === 'eliminate' || hint.kind === 'finale' ? '#f7b223' : '#ffffff',
              fontWeight: hint.kind === 'eliminate' || hint.kind === 'finale' ? 600 : 400,
              display: 'flex', alignItems: 'flex-start', gap: '6px',
            }}>
              {hint.kind === 'eliminate' || hint.kind === 'eliminate_soon'
                ? <AlertTriangle size={11} style={{ color: '#e85d4f', flexShrink: 0, marginTop: '4px' }} />
                : <span style={{ color: '#f7b223', flexShrink: 0, marginTop: '2px' }}>›</span>}
              <span style={{ flex: 1 }}>{hint.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FORMAT VIEW
// ============================================================

function FormatView({ format, setFormat, resetFormat, playedGameIds, togglePlayed, resetPlayed, selectGameById, tonightCast, allPrefs, generateFormatFromCurrentCast, goToCastSetup }) {
  const [editMode, setEditMode] = useState(false);
  const [collapsedRounds, setCollapsedRounds] = useState({});
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  function toggleCollapsed(roundIdx) {
    setCollapsedRounds(prev => ({ ...prev, [roundIdx]: !prev[roundIdx] }));
  }
  function updateRound(idx, updates) {
    setFormat(prev => ({ ...prev, rounds: prev.rounds.map((r, i) => i === idx ? { ...r, ...updates } : r) }));
  }
  function updateSlotInRound(roundIdx, slotIdx, updates) {
    setFormat(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => {
        if (i !== roundIdx) return r;
        return { ...r, games: r.games.map((g, gi) => gi === slotIdx ? { ...g, ...updates } : g) };
      }),
    }));
  }
  function removeSlotFromRound(roundIdx, slotIdx) {
    setFormat(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => i === roundIdx ? { ...r, games: r.games.filter((_, gi) => gi !== slotIdx) } : r),
    }));
  }
  function addEmptySlotToRound(roundIdx) {
    setFormat(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => i === roundIdx ? { ...r, games: [...r.games, { gameId: null, playersInGame: 2, note: '' }] } : r),
    }));
  }
  function addRound() {
    setFormat(prev => ({
      ...prev,
      rounds: [...prev.rounds, { number: prev.rounds.length + 1, playersOnStage: 0, games: [], eliminate: 0 }],
    }));
  }
  function removeRound(idx) {
    if (!confirm('Remove this round from the format?')) return;
    setFormat(prev => ({
      ...prev,
      rounds: prev.rounds.filter((_, i) => i !== idx).map((r, i) => ({ ...r, number: i + 1 })),
    }));
  }
  function handleResetFormat() {
    if (confirm('Reset the running order back to the default Maestro format? Your customizations will be lost.')) resetFormat();
  }
  function handleResetPlayed() {
    if (confirm('Clear all played-game marks and slot assignments?')) resetPlayed();
  }
  function handleGenerate() {
    generateFormatFromCurrentCast();
    setShowGenerateConfirm(false);
  }

  const hasCast = tonightCast.length >= 4;

  // Compute the next suggested game (single instance for whole view)
  const nextSuggestion = useMemo(
    () => suggestNextGame(format, playedGameIds, tonightCast, allPrefs),
    [format, playedGameIds, tonightCast, allPrefs]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="display-font" style={{ fontSize: '32px', color: '#ffffff', lineHeight: 1 }}>
            {format.title}
          </h2>
          <p className="label-dim" style={{ fontSize: '14px', marginTop: '4px', fontStyle: 'italic' }}>
            {format.subtitle}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => hasCast ? setShowGenerateConfirm(true) : null}
            className="btn"
            disabled={!hasCast}
            style={{
              background: hasCast ? '#4ade80' : 'transparent',
              color: hasCast ? '#0a1628' : '#7a92b8',
              borderColor: hasCast ? '#4ade80' : '#2a4970',
              opacity: hasCast ? 1 : 0.5,
              cursor: hasCast ? 'pointer' : 'not-allowed',
            }}
            title={hasCast ? 'Build a format around tonight\'s cast' : 'Set up at least 4 players in tonight\'s cast first'}>
            <Users size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
            BUILD FROM TONIGHT&apos;S CAST
          </button>
          <button onClick={() => setEditMode(!editMode)} className="btn" style={{
            background: editMode ? '#f7b223' : 'transparent',
            color: editMode ? '#0a1628' : '#f7b223',
          }}>
            <Edit2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
            {editMode ? 'DONE EDITING' : 'EDIT FORMAT'}
          </button>
          <button onClick={() => window.print()} className="btn"
            title="Open the browser print dialog. Choose 'Save as PDF' to save a copy.">
            <Printer size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
            PRINT / SAVE PDF
          </button>
          {playedGameIds.length > 0 && (
            <button onClick={handleResetPlayed} className="btn btn-danger">
              CLEAR PLAYED ({playedGameIds.length})
            </button>
          )}
          {editMode && (
            <button onClick={handleResetFormat} className="btn btn-danger">
              <RotateCcw size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
              RESET FORMAT
            </button>
          )}
        </div>
      </div>

      {!hasCast && (
        <div className="panel" style={{ padding: '16px 20px', marginBottom: '16px', borderColor: '#f7b223', borderStyle: 'dashed' }}>
          <div className="flex items-start gap-3">
            <Users size={20} style={{ color: '#f7b223', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: '#ffffff', fontSize: '15px', marginBottom: '4px', fontWeight: 600 }}>
                Showing the default sample format
              </p>
              <p className="label-dim" style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '10px' }}>
                Set up at least 4 players in tonight&apos;s cast and Wayward&apos;s helper will build a running order tailored to who&apos;s on stage - respecting preferences, surfacing good fits, and varying game types across the show.
              </p>
              <button onClick={goToCastSetup} className="btn btn-primary">
                <Plus size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                SET UP TONIGHT&apos;S CAST
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panel" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px' }}>PRE-SHOW</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {format.preShow.map((item, i) => (
            <li key={i} style={{ color: '#ffffff', fontSize: '15px', padding: '4px 0' }}>
              <span style={{ color: '#f7b223', marginRight: '8px' }}>•</span>{item}
            </li>
          ))}
        </ul>
      </div>

      {format.rounds.map((round, idx) => {
        const isCollapsed = collapsedRounds[idx];
        return (
          <div key={idx} className="panel" style={{ padding: '20px', marginBottom: '16px' }}>
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2" style={{ borderBottom: '1px solid #2a4970', paddingBottom: '8px' }}>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleCollapsed(idx)} style={{ background: 'none', border: 'none', color: '#f7b223', cursor: 'pointer' }}>
                  {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
                <h3 className="display-font" style={{ fontSize: '24px', color: '#f7b223', lineHeight: 1 }}>Round {round.number}</h3>
                {editMode && (
                  <button onClick={() => removeRound(idx)} style={{ background: 'none', border: 'none', color: '#e85d4f', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {editMode ? (
                <div className="flex items-center gap-2">
                  <span className="mono-font label-dim" style={{ fontSize: '11px' }}>PLAYERS ON STAGE:</span>
                  <input type="number" value={round.playersOnStage}
                    onChange={(e) => updateRound(idx, { playersOnStage: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      background: '#0a1628', border: '1px solid #2a4970', color: '#f7b223',
                      padding: '4px 8px', width: '60px', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '13px',
                    }} />
                </div>
              ) : (
                <span className="mono-font" style={{
                  fontSize: '11px', color: '#f7b223', border: '1px solid #2a4970',
                  padding: '3px 8px', letterSpacing: '0.04em', fontWeight: 600,
                }}>{round.playersOnStage} PLAYERS ON STAGE</span>
              )}
            </div>

            {!isCollapsed && (
              <>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {round.games.map((slot, i) => {
                    const gameData = slot.gameId ? GAMES.find(x => x.id === slot.gameId) : null;
                    const isPlayed = slot.gameId && playedGameIds.includes(slot.gameId);
                    const isFilled = !!gameData;
                    const isSuggestionTarget = !isFilled && nextSuggestion
                      && nextSuggestion.roundIdx === idx && nextSuggestion.slotIdx === i;
                    const suggestedGame = isSuggestionTarget ? nextSuggestion.game : null;

                    const slotLabel = `Game #${i + 1}`;
                    const playerCountLabel = typeof slot.playersInGame === 'number'
                      ? `${slot.playersInGame} player${slot.playersInGame > 1 ? 's' : ''}`
                      : slot.playersInGame;

                    return (
                      <li key={i} style={{
                        padding: '10px 0',
                        borderBottom: i < round.games.length - 1 ? '1px solid #15294a' : 'none',
                        opacity: isPlayed ? 0.55 : 1,
                      }}>
                        {editMode ? (
                          // Edit mode: just slot-level controls (player count, optional note, remove slot)
                          <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <span className="mono-font" style={{ fontSize: '12px', color: '#b8d4f0', minWidth: '60px' }}>
                                Game #{i + 1}
                              </span>
                              <input type="text" value={slot.playersInGame}
                                onChange={(e) => {
                                  const v = e.target.value; const num = parseInt(v, 10);
                                  updateSlotInRound(idx, i, { playersInGame: isNaN(num) ? v : num });
                                }}
                                placeholder="# players or label"
                                style={{ flex: 1, background: '#0a1628', border: '1px solid #2a4970', color: '#f7b223', padding: '6px 8px', fontSize: '13px', fontFamily: 'JetBrains Mono' }} />
                              <button onClick={() => removeSlotFromRound(idx, i)} style={{ background: 'none', border: 'none', color: '#e85d4f', cursor: 'pointer' }}
                                title="Remove this slot">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <input type="text" value={slot.note || ''}
                              onChange={(e) => updateSlotInRound(idx, i, { note: e.target.value })}
                              placeholder="Optional note for this slot"
                              style={{ width: '100%', background: '#0a1628', border: '1px solid #2a4970', color: '#ffffff', padding: '6px 8px', fontSize: '13px', fontFamily: 'inherit' }} />
                            {slot.gameId && gameData && (
                              <p className="label-dim" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                Currently assigned: {gameData.name}
                              </p>
                            )}
                          </div>
                        ) : isFilled ? (
                          // Filled slot (game played and assigned here)
                          <div className="flex items-start gap-3">
                            <button onClick={() => togglePlayed(slot.gameId)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: isPlayed ? '#f7b223' : '#b8d4f0', flexShrink: 0, marginTop: '2px',
                            }} title={isPlayed ? 'Mark as not played' : 'Mark as played'}>
                              {isPlayed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>
                            <div style={{ flex: 1 }}>
                              <button onClick={() => selectGameById(slot.gameId)} style={{
                                background: 'none', border: 'none', padding: 0, textAlign: 'left',
                                color: '#ffffff', fontSize: '16px', fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textDecorationColor: '#f7b223', textDecorationThickness: '1px',
                                textUnderlineOffset: '3px', fontFamily: 'inherit',
                                textDecorationStyle: isPlayed ? 'line-through' : 'solid',
                              }}>
                                {gameData.name}
                              </button>
                              {slot.note && (
                                <div className="label-dim" style={{ fontSize: '13px', marginTop: '2px', fontStyle: 'italic' }}>{slot.note}</div>
                              )}
                            </div>
                            <span className="mono-font" style={{
                              fontSize: '11px', color: '#f7b223', border: '1px solid #2a4970',
                              padding: '3px 8px', whiteSpace: 'nowrap', letterSpacing: '0.04em',
                            }}>
                              {playerCountLabel}
                            </span>
                          </div>
                        ) : (
                          // Empty slot - placeholder, with green suggestion if it's the next-up target
                          <div className="flex items-start gap-3">
                            <Circle size={18} style={{ color: '#3a5980', flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ flex: 1 }}>
                              <p className="mono-font" style={{
                                fontSize: '14px',
                                color: isSuggestionTarget ? '#4ade80' : '#7a92b8',
                                fontWeight: 600, letterSpacing: '0.04em',
                              }}>
                                {slotLabel}
                              </p>
                              {isSuggestionTarget && suggestedGame ? (
                                <div style={{ marginTop: '4px' }}>
                                  <button onClick={() => selectGameById(suggestedGame.id)} style={{
                                    background: 'none', border: 'none', padding: 0, textAlign: 'left',
                                    color: '#4ade80', fontSize: '15px', fontWeight: 600,
                                    cursor: 'pointer', textDecoration: 'underline',
                                    textDecorationColor: '#4ade80', textDecorationThickness: '1px',
                                    textUnderlineOffset: '3px', fontFamily: 'inherit',
                                  }}>
                                    Suggested: {suggestedGame.name}
                                  </button>
                                  {nextSuggestion.boostScore > 0 && (
                                    <p className="label-dim" style={{ fontSize: '12px', marginTop: '2px', fontStyle: 'italic' }}>
                                      Good fit for {nextSuggestion.boostScore} player{nextSuggestion.boostScore > 1 ? 's' : ''} tonight
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="label-dim" style={{ fontSize: '12px', marginTop: '2px', fontStyle: 'italic' }}>
                                  Waiting to be filled in
                                </p>
                              )}
                              {slot.note && (
                                <div className="label-dim" style={{ fontSize: '12px', marginTop: '3px', fontStyle: 'italic' }}>{slot.note}</div>
                              )}
                            </div>
                            <span className="mono-font" style={{
                              fontSize: '11px',
                              color: isSuggestionTarget ? '#4ade80' : '#7a92b8',
                              border: `1px solid ${isSuggestionTarget ? '#4ade80' : '#2a4970'}`,
                              padding: '3px 8px', whiteSpace: 'nowrap', letterSpacing: '0.04em',
                            }}>
                              {playerCountLabel}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {editMode && (
                  <button onClick={() => addEmptySlotToRound(idx)} className="btn" style={{ width: '100%', marginTop: '10px' }}>
                    <Plus size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                    ADD EMPTY SLOT
                  </button>
                )}

                {editMode ? (
                  <div className="flex items-center gap-2" style={{ marginTop: '12px' }}>
                    <span className="mono-font label-dim" style={{ fontSize: '11px' }}>ELIMINATE AFTER:</span>
                    <input type="number" value={round.eliminate}
                      onChange={(e) => updateRound(idx, { eliminate: parseInt(e.target.value, 10) || 0 })}
                      style={{ background: '#0a1628', border: '1px solid #2a4970', color: '#e85d4f', padding: '4px 8px', width: '60px', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '13px' }} />
                    <span className="mono-font label-dim" style={{ fontSize: '11px' }}>PLAYERS</span>
                  </div>
                ) : (
                  round.eliminate > 0 && (
                    <div style={{
                      marginTop: '12px', padding: '8px 12px', background: '#15294a',
                      border: '1px solid #e85d4f', color: '#e85d4f', fontSize: '13px',
                      fontFamily: 'JetBrains Mono', letterSpacing: '0.04em', fontWeight: 600,
                    }}>
                      ELIMINATE {round.eliminate} PLAYER{round.eliminate > 1 ? 'S' : ''}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        );
      })}

      {editMode && (
        <button onClick={addRound} className="btn" style={{ width: '100%', marginBottom: '16px' }}>
          <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
          ADD A ROUND
        </button>
      )}

      <div className="panel" style={{ padding: '16px 20px' }}>
        <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px' }}>CLOSE</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {format.postShow.map((item, i) => (
            <li key={i} style={{ color: '#ffffff', fontSize: '15px', padding: '4px 0' }}>
              <span style={{ color: '#f7b223', marginRight: '8px' }}>•</span>{item}
            </li>
          ))}
        </ul>
      </div>

      <p className="label-dim" style={{ fontSize: '12px', marginTop: '16px', fontStyle: 'italic', textAlign: 'center' }}>
        Tap any underlined game to jump to its description. Mark games played from the Games view - they fill in here automatically. The green "Suggested" line shows what to play next.
      </p>

      {/* Generate from cast confirmation modal */}
      {showGenerateConfirm && (
        <div onClick={() => setShowGenerateConfirm(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 22, 40, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#15294a', border: '2px solid #4ade80',
            padding: '24px', maxWidth: '460px', width: '100%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          }}>
            <div className="flex items-center gap-3 mb-3">
              <Users size={24} style={{ color: '#4ade80', flexShrink: 0 }} />
              <h3 className="display-font" style={{ fontSize: '22px', color: '#4ade80', lineHeight: 1 }}>
                Build From Tonight&apos;s Cast?
              </h3>
            </div>
            <p style={{ fontSize: '15px', color: '#ffffff', marginBottom: '8px', lineHeight: 1.5 }}>
              Wayward&apos;s helper will build a running order for the <strong style={{ color: '#f7b223' }}>{tonightCast.length}</strong> player{tonightCast.length !== 1 ? 's' : ''} you have on stage.
            </p>
            <p className="label-dim" style={{ fontSize: '13px', marginBottom: '14px', lineHeight: 1.5 }}>
              The new format will:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px 0' }}>
              <li style={{ fontSize: '13px', color: '#b8d4f0', padding: '3px 0' }}>
                <span style={{ color: '#4ade80', marginRight: '6px' }}>•</span>Skip games that conflict with anyone&apos;s preferences
              </li>
              <li style={{ fontSize: '13px', color: '#b8d4f0', padding: '3px 0' }}>
                <span style={{ color: '#4ade80', marginRight: '6px' }}>•</span>Pick good fits first, then fill in neutral games
              </li>
              <li style={{ fontSize: '13px', color: '#b8d4f0', padding: '3px 0' }}>
                <span style={{ color: '#4ade80', marginRight: '6px' }}>•</span>Vary game types so no two similar games are in the same show
              </li>
              <li style={{ fontSize: '13px', color: '#b8d4f0', padding: '3px 0' }}>
                <span style={{ color: '#4ade80', marginRight: '6px' }}>•</span>Scale rounds and eliminations to your cast size
              </li>
            </ul>
            <p style={{ fontSize: '13px', color: '#e85d4f', marginBottom: '20px', fontStyle: 'italic', lineHeight: 1.4 }}>
              Heads up: this replaces the current format. You can still edit it after generation.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowGenerateConfirm(false)} className="btn">
                CANCEL
              </button>
              <button onClick={handleGenerate} className="btn"
                style={{ background: '#4ade80', color: '#0a1628', borderColor: '#4ade80' }}>
                <Users size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-top' }} />
                BUILD IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PRINTABLE FORMAT
// ============================================================
// Hidden on screen, shown only during print (window.print).
// Renders the running order with all empty slots filled in by suggested games.

function PrintableFormat({ format, tonightCast, playedGameIds, allPrefs }) {
  const suggestions = useMemo(
    () => suggestAllForFormat(format, playedGameIds, tonightCast, allPrefs),
    [format, playedGameIds, tonightCast, allPrefs]
  );

  if (!format || !format.rounds || format.rounds.length === 0) return null;

  const dateStr = new Date().toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="print-only">
      <h1>{format.title}</h1>
      <p className="print-subtitle">
        {format.subtitle} · {dateStr} · {tonightCast.length} player{tonightCast.length !== 1 ? 's' : ''}
      </p>

      {tonightCast.length > 0 && (
        <>
          <h2>Tonight&apos;s Cast</h2>
          <div className="print-cast-list">
            {tonightCast.sort((a, b) => (a.playerNumber || 0) - (b.playerNumber || 0)).map(player => {
              const prefLabels = (player.preferences || [])
                .map(pid => allPrefs.find(p => p.id === pid))
                .filter(Boolean);
              return (
                <div key={player.id} className="print-cast-item">
                  <strong>P{player.playerNumber || '?'}. {player.name}</strong>
                  {prefLabels.length > 0 && (
                    <div className="print-cast-prefs">
                      {prefLabels.map(p => p.label).join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2>Running Order</h2>
      {format.preShow && format.preShow.length > 0 && (
        <>
          <h3>Pre-Show</h3>
          {format.preShow.map((item, i) => (
            <div key={i} style={{ fontSize: '11pt', padding: '2pt 0' }}>• {item}</div>
          ))}
        </>
      )}

      {format.rounds.map((round, rIdx) => (
        <div key={rIdx} className="print-round">
          <h3>
            Round {round.number}
            <span className="print-stage-size">· {round.playersOnStage} on stage</span>
          </h3>
          {round.games.map((slot, sIdx) => {
            const playedGame = slot.gameId ? GAMES.find(g => g.id === slot.gameId) : null;
            const suggestion = !slot.gameId ? suggestions[`${rIdx}_${sIdx}`] : null;
            const playerCountLabel = typeof slot.playersInGame === 'number'
              ? `${slot.playersInGame} player${slot.playersInGame > 1 ? 's' : ''}`
              : slot.playersInGame;

            return (
              <div key={sIdx} className="print-slot">
                <div className="print-slot-num">Game #{sIdx + 1}</div>
                <div className="print-slot-name">
                  {playedGame ? (
                    <span className="print-strike">✓ {playedGame.name}</span>
                  ) : suggestion ? (
                    <>
                      <span className="print-accent">{suggestion.game.name}</span>
                      {suggestion.boostScore > 0 && (
                        <div className="print-slot-reason">
                          Good fit for {suggestion.boostScore} player{suggestion.boostScore > 1 ? 's' : ''} tonight
                        </div>
                      )}
                    </>
                  ) : (
                    <em style={{ color: '#666' }}>(pick during show)</em>
                  )}
                </div>
                <div className="print-slot-meta">{playerCountLabel}</div>
              </div>
            );
          })}
          {round.eliminate > 0 && (
            <div className="print-eliminate">
              Eliminate {round.eliminate} player{round.eliminate > 1 ? 's' : ''} after this round
            </div>
          )}
        </div>
      ))}

      {format.postShow && format.postShow.length > 0 && (
        <>
          <h3>Close</h3>
          {format.postShow.map((item, i) => (
            <div key={i} style={{ fontSize: '11pt', padding: '2pt 0' }}>• {item}</div>
          ))}
        </>
      )}

      <p className="print-footer">
        ✓ = already played · suggested games are based on tonight&apos;s cast preferences and shape-of-show. Pick during the show as the energy dictates.
      </p>
    </div>
  );
}

// ============================================================
// CAST SETUP VIEW
// ============================================================

function CastSetupView({ roster, tonightCast, addToTonight, removeFromTonight, addAdHocPlayer, updateTonightPlayer, toggleTonightPref, resetTonight, goBack, allPrefs }) {
  const [adHocName, setAdHocName] = useState('');
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  const isInTonight = (id) => tonightCast.some(t => t.id === id);

  function handleAddAdHoc() {
    if (adHocName.trim()) { addAdHocPlayer(adHocName); setAdHocName(''); }
  }
  function handleReset() {
    if (confirm('Clear tonight\'s lineup? (Your saved roster will not be affected.)')) resetTonight();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="btn">
            <ArrowLeft size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />BACK
          </button>
          <div>
            <h2 className="display-font display-font-responsive" style={{ fontSize: '28px', color: '#ffffff' }}>Set Up Tonight&apos;s Cast</h2>
            <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginTop: '4px' }}>
              {tonightCast.length} ON STAGE · CHANGES PERSIST PER SESSION
            </p>
          </div>
        </div>
        <button onClick={handleReset} className="btn btn-danger">
          <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
          RESET TONIGHT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h3 className="display-font" style={{ fontSize: '20px', color: '#f7b223', marginBottom: '12px', borderBottom: '1px solid #2a4970', paddingBottom: '4px' }}>
            Tonight&apos;s Lineup
          </h3>

          {tonightCast.length === 0 && (
            <div className="panel" style={{ padding: '20px', textAlign: 'center', marginBottom: '12px', borderStyle: 'dashed' }}>
              <p className="label-dim" style={{ fontSize: '14px' }}>
                Pull players from the saved roster on the right, or add an ad-hoc player below.
              </p>
            </div>
          )}

          <div className="space-y-2 mb-4">
            {tonightCast.sort((a, b) => (a.playerNumber || 0) - (b.playerNumber || 0)).map(player => {
              const isExpanded = expandedPlayer === player.id;
              return (
                <div key={player.id} style={{
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #15294a 100%)',
                  border: '1px solid #f7b223', padding: '12px',
                }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ flex: 1 }}>
                      <span className="mono-font" style={{
                        fontSize: '12px', background: '#f7b223', color: '#0a1628',
                        padding: '3px 8px', fontWeight: 700,
                      }}>P{player.playerNumber}</span>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>{player.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                        style={{ color: '#f7b223', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => removeFromTonight(player.id)}
                        style={{ color: '#e85d4f', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {player.preferences.length > 0 && !isExpanded && (
                    <div className="mt-2 flex flex-wrap" style={{ gap: '3px' }}>
                      {player.preferences.map(pid => {
                        const p = allPrefs.find(pr => pr.id === pid);
                        if (!p) return null;
                        const color = p.kind === 'like' ? '#4ade80' : '#ef4444';
                        return (
                          <span key={pid} style={{
                            fontSize: '11px', color, fontWeight: 600,
                            padding: '2px 6px', borderRadius: '2px',
                            border: `1px solid ${color}`,
                          }}>{p.label}</span>
                        );
                      })}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-3" style={{ borderTop: '1px solid #2a4970', paddingTop: '10px' }}>
                      <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>
                        LIKES & DISLIKES (THIS SESSION ONLY)
                      </p>
                      <div className="mb-3">
                        {allPrefs.map(pref => (
                          <PrefChip key={pref.id} pref={pref}
                            isOn={(player.preferences || []).includes(pref.id)}
                            onClick={() => toggleTonightPref(player.id, pref.id)} />
                        ))}
                      </div>
                      <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>
                        NOTES (THIS SESSION ONLY)
                      </p>
                      <textarea value={player.notes || ''}
                        onChange={(e) => updateTonightPlayer(player.id, { notes: e.target.value })}
                        placeholder="Anything specific for tonight..."
                        style={{
                          width: '100%', background: '#0a1628', border: '1px solid #2a4970',
                          color: '#ffffff', padding: '8px', fontSize: '14px', fontFamily: 'inherit',
                          minHeight: '50px', resize: 'vertical',
                        }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="panel" style={{ padding: '12px' }}>
            <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>
              ADD AD-HOC PLAYER (NOT SAVED TO ROSTER)
            </p>
            <div className="flex gap-2">
              <input type="text" value={adHocName}
                onChange={(e) => setAdHocName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAdHoc()}
                placeholder="Player name..."
                style={{ flex: 1, background: '#0a1628', border: '1px solid #2a4970', color: '#ffffff', padding: '8px', fontSize: '14px', fontFamily: 'inherit' }} />
              <button onClick={handleAddAdHoc} className="btn btn-primary"><Plus size={14} /></button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="display-font" style={{ fontSize: '20px', color: '#f7b223', marginBottom: '12px', borderBottom: '1px solid #2a4970', paddingBottom: '4px' }}>
            Saved Roster
          </h3>
          <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '12px' }}>
            TAP TO ADD TO TONIGHT
          </p>

          <div className="space-y-1">
            {roster.map(player => {
              const added = isInTonight(player.id);
              return (
                <button key={player.id} onClick={() => !added && addToTonight(player.id)}
                  disabled={added} className="w-full text-left px-3 py-2"
                  style={{
                    background: added ? '#15294a' : '#0a1628',
                    border: '1px solid ' + (added ? '#2a4970' : '#15294a'),
                    color: added ? '#7a92b8' : '#ffffff',
                    fontSize: '14px', opacity: added ? 0.6 : 1,
                    cursor: added ? 'default' : 'pointer',
                  }}>
                  <div className="flex items-center justify-between">
                    <span>{player.name}</span>
                    {added ? <Check size={14} style={{ color: '#f7b223' }} /> : <Plus size={14} className="label-dim" />}
                  </div>
                  {!added && player.preferences.length > 0 && (
                    <div className="mt-1 flex flex-wrap" style={{ gap: '2px' }}>
                      {player.preferences.map(pid => {
                        const p = allPrefs.find(pr => pr.id === pid);
                        if (!p) return null;
                        const color = p.kind === 'like' ? '#4ade80' : '#ef4444';
                        return (
                          <span key={pid} style={{
                            fontSize: '10px', color, fontWeight: 600,
                            padding: '1px 5px', borderRadius: '2px',
                            border: `1px solid ${color}`, opacity: 0.85,
                          }}>{p.label}</span>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={goBack} className="btn btn-primary">
          <ArrowLeft size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
          BACK TO GAMES
        </button>
      </div>
    </div>
  );
}

// ============================================================
// GAME ROW + DETAIL
// ============================================================

function GameRow({ game, selectedGame, setSelectedGame, isPlayed, onTogglePlayed, showShapeWarning }) {
  const hasConflict = game.evaluation && game.evaluation.conflicts.length > 0;
  const hasBoost = game.evaluation && game.evaluation.boosts.length > 0;
  const hasShape = (game.shapeReasons || []).length > 0;
  const borderClass = hasConflict ? 'conflict-border' : (hasShape ? 'shape-border' : (hasBoost ? 'boost-border' : 'clean-border'));
  return (
    <div className={`game-card ${borderClass}`} style={{
      background: selectedGame?.id === game.id ? '#1e3a5f' : '#15294a',
      color: '#ffffff', display: 'flex', alignItems: 'stretch',
    }}>
      {onTogglePlayed && (
        <button onClick={(e) => { e.stopPropagation(); onTogglePlayed(); }} style={{
          background: isPlayed ? '#15294a' : 'transparent', border: 'none', borderRight: '1px solid #2a4970',
          color: isPlayed ? '#f7b223' : '#b8d4f0', cursor: 'pointer', padding: '0 12px', flexShrink: 0,
        }} title={isPlayed ? 'Played tonight (click to undo)' : 'Mark as played tonight'}>
          {isPlayed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>
      )}
      <button onClick={() => setSelectedGame(game)} style={{
        flex: 1, background: 'transparent', border: 'none', textAlign: 'left',
        padding: '12px 16px', color: '#ffffff', cursor: 'pointer',
        opacity: isPlayed ? 0.55 : 1,
      }}>
        <div className="flex items-center justify-between">
          <div style={{ flex: 1 }}>
            <div className="display-font" style={{
              fontSize: '20px', color: '#ffffff',
              textDecoration: isPlayed ? 'line-through' : 'none',
              textDecorationColor: '#f7b223',
            }}>{game.name}</div>
            <div className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.06em', marginTop: '2px' }}>
              {game.tags.join(' · ')}
            </div>
          </div>
          <ChevronRight size={16} className="label-dim" />
        </div>
        {hasConflict && (
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#e85d4f' }}>
            <AlertTriangle size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
            Conflicts: {[...new Set(game.evaluation.conflicts.map(c => c.playerName))].join(', ')}
          </div>
        )}
        {hasBoost && !hasConflict && (
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#f7b223' }}>
            ★ Good fit: {[...new Set(game.evaluation.boosts.map(b => b.playerName))].join(', ')}
          </div>
        )}
        {showShapeWarning && hasShape && (
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#d4a83f', fontStyle: 'italic' }}>
            <Info size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
            {game.shapeReasons.join(' · ')}
          </div>
        )}
      </button>
    </div>
  );
}

function GameDetail({ game, tonightCast, onClose, isPlayed, onTogglePlayed, allPrefs }) {
  const evaluation = evaluateGame(game, tonightCast, allPrefs);
  const shapeReasons = game.shapeReasons || [];
  return (
    <div className="panel">
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #2a4970' }}>
        <div className="flex items-start justify-between">
          <div style={{ flex: 1 }}>
            <h3 className="display-font" style={{
              fontSize: '28px', color: '#f7b223', lineHeight: 1,
              textDecoration: isPlayed ? 'line-through' : 'none',
            }}>{game.name}</h3>
            {game.altNames && game.altNames.length > 0 && (
              <p className="mono-font label-dim" style={{ fontSize: '11px', marginTop: '4px', fontStyle: 'italic' }}>
                a.k.a. {game.altNames.join(', ')}
              </p>
            )}
            <div className="mt-2">
              {game.tags.map(t => (
                <span key={t} className="tag-pill" style={{ cursor: 'default' }}>{t}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="label-dim" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        {onTogglePlayed && (
          <button onClick={onTogglePlayed} className="btn" style={{ marginTop: '12px', width: '100%' }}>
            {isPlayed ? (
              <><CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-top' }} />MARKED AS PLAYED · TAP TO UNDO</>
            ) : (
              <><Circle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-top' }} />MARK AS PLAYED TONIGHT</>
            )}
          </button>
        )}
      </div>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a4970' }}>
        <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px' }}>DESCRIPTION</p>
        <p style={{ fontSize: '15px', lineHeight: 1.5, color: '#ffffff' }}>{game.description}</p>
      </div>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a4970', background: '#0a1628' }}>
        <p className="mono-font" style={{ fontSize: '11px', color: '#f7b223', letterSpacing: '0.1em', marginBottom: '8px' }}>
          DELIVERING THE SETUP
        </p>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#ffffff', fontStyle: 'italic' }}>
          &ldquo;{game.delivery}&rdquo;
        </p>
      </div>

      {game.notes && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a4970' }}>
          <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px' }}>DIRECTOR&apos;S NOTES</p>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#b8d4f0' }}>{game.notes}</p>
        </div>
      )}

      {shapeReasons.length > 0 && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a4970' }}>
          <p className="mono-font" style={{ fontSize: '11px', color: '#d4a83f', letterSpacing: '0.1em', marginBottom: '8px' }}>
            <Info size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />SHAPE-OF-SHOW NOTE
          </p>
          {shapeReasons.map((r, i) => (
            <div key={i} style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>{r}</div>
          ))}
        </div>
      )}

      {evaluation.conflicts.length > 0 && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a4970' }}>
          <p className="mono-font" style={{ fontSize: '11px', color: '#e85d4f', letterSpacing: '0.1em', marginBottom: '8px' }}>
            <AlertTriangle size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />CONFLICTS
          </p>
          {evaluation.conflicts.map((c, i) => (
            <div key={i} style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>
              <strong style={{ color: '#e85d4f' }}>{c.playerName}</strong> · {c.pref}
            </div>
          ))}
        </div>
      )}

      {evaluation.boosts.length > 0 && (
        <div style={{ padding: '16px 20px' }}>
          <p className="mono-font" style={{ fontSize: '11px', color: '#f7b223', letterSpacing: '0.1em', marginBottom: '8px' }}>★ GOOD FIT FOR</p>
          {[...new Map(evaluation.boosts.map(b => [b.playerId, b])).values()].map((b, i) => (
            <div key={i} style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>
              <strong style={{ color: '#f7b223' }}>{b.playerName}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ROSTER VIEW (with custom pref editor)
// ============================================================

function RosterView({ roster, updatePlayer, deletePlayer, addPlayer, togglePlayerPref, editingPlayer, setEditingPlayer, allPrefs, customPrefs, addCustomPref, deleteCustomPref }) {
  const [newPrefLabel, setNewPrefLabel] = useState('');
  const [newPrefKind, setNewPrefKind] = useState('dislike');
  const [newPrefTags, setNewPrefTags] = useState([]);
  const [showAddPref, setShowAddPref] = useState(false);
  // Confirmation modal state - { type: 'player'|'pref', id, name }
  const [confirmDelete, setConfirmDelete] = useState(null);

  function handleConfirmedDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'player') {
      deletePlayer(confirmDelete.id);
    } else if (confirmDelete.type === 'pref') {
      deleteCustomPref(confirmDelete.id);
    }
    setConfirmDelete(null);
  }

  function handleAddPref() {
    if (!newPrefLabel.trim()) return;
    if (newPrefKind === 'dislike') {
      addCustomPref(newPrefLabel, 'dislike', newPrefTags, []);
    } else {
      addCustomPref(newPrefLabel, 'like', [], newPrefTags);
    }
    setNewPrefLabel('');
    setNewPrefTags([]);
    setShowAddPref(false);
  }

  function toggleNewPrefTag(tag) {
    setNewPrefTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
        <div>
          <h2 className="display-font display-font-responsive" style={{ fontSize: '28px', color: '#ffffff' }}>The Saved Roster</h2>
          <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginTop: '4px' }}>
            {roster.length} PLAYERS
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddPref(!showAddPref)} className="btn">
            <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
            {showAddPref ? 'CANCEL' : 'ADD LIKE / DISLIKE'}
          </button>
          <button onClick={addPlayer} className="btn btn-primary">
            <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
            ADD PLAYER
          </button>
        </div>
      </div>

      {/* Add custom pref panel */}
      {showAddPref && (
        <div className="panel" style={{ padding: '20px', marginBottom: '16px', borderColor: '#f7b223' }}>
          <h3 className="display-font" style={{ fontSize: '18px', color: '#f7b223', marginBottom: '12px' }}>
            New Like or Dislike
          </h3>
          <div className="mb-3">
            <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>TYPE</p>
            <div className="flex gap-2">
              <button onClick={() => setNewPrefKind('like')} className="btn btn-success"
                style={{ background: newPrefKind === 'like' ? '#4ade80' : 'transparent', color: newPrefKind === 'like' ? '#0a1628' : '#4ade80' }}>
                <Heart size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                LIKE
              </button>
              <button onClick={() => setNewPrefKind('dislike')} className="btn btn-danger"
                style={{ background: newPrefKind === 'dislike' ? '#ef4444' : 'transparent', color: newPrefKind === 'dislike' ? '#ffffff' : '#ef4444' }}>
                <HeartOff size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                DISLIKE
              </button>
            </div>
          </div>
          <div className="mb-3">
            <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>LABEL (KEEP IT SHORT)</p>
            <input type="text" value={newPrefLabel}
              onChange={(e) => setNewPrefLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPref()}
              placeholder={newPrefKind === 'like' ? 'e.g., Loves accents' : 'e.g., No improvising songs'}
              maxLength={28}
              style={{ width: '100%', background: '#0a1628', border: '1px solid #2a4970', color: '#ffffff', padding: '8px', fontSize: '14px', fontFamily: 'inherit' }} />
          </div>
          <div className="mb-3">
            <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>
              {newPrefKind === 'like' ? 'BOOST FOR GAMES TAGGED (optional)' : 'CONFLICT WITH GAMES TAGGED (optional)'}
            </p>
            <p className="label-dim" style={{ fontSize: '12px', marginBottom: '8px', fontStyle: 'italic' }}>
              Pick zero or more tags. If left empty, this is a label-only preference and won&apos;t flag or boost games automatically.
            </p>
            <div>
              {DESCRIPTIVE_TAGS.map(tag => (
                <span key={tag} onClick={() => toggleNewPrefTag(tag)}
                  className={`tag-pill ${newPrefTags.includes(tag) ? 'active' : ''}`}>{tag}</span>
              ))}
            </div>
          </div>
          <button onClick={handleAddPref} className="btn btn-primary" disabled={!newPrefLabel.trim()}
            style={{ opacity: newPrefLabel.trim() ? 1 : 0.5 }}>
            <Save size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
            ADD TO LIKES/DISLIKES
          </button>
        </div>
      )}

      {/* Custom prefs list */}
      {customPrefs.length > 0 && (
        <div className="panel" style={{ padding: '16px', marginBottom: '16px' }}>
          <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px' }}>
            YOUR CUSTOM LIKES/DISLIKES · {customPrefs.length}
          </p>
          <div>
            {customPrefs.map(pref => (
              <PrefChip key={pref.id} pref={pref} isOn={true}
                onClick={() => {}}
                onDelete={() => setConfirmDelete({ type: 'pref', id: pref.id, name: pref.label })} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roster.map(player => {
          const isEditing = editingPlayer === player.id;
          return (
            <div key={player.id} className="panel" style={{ padding: '16px' }}>
              <div className="flex items-start justify-between mb-3">
                {isEditing ? (
                  <input type="text" value={player.name}
                    onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                    className="display-font"
                    style={{ fontSize: '20px', color: '#ffffff', background: '#0a1628', border: '1px solid #f7b223', padding: '4px 8px', width: '70%' }}
                    autoFocus />
                ) : (
                  <h3 className="display-font" style={{ fontSize: '20px', color: '#ffffff' }}>{player.name}</h3>
                )}
                <div className="flex gap-1">
                  <button onClick={() => setEditingPlayer(isEditing ? null : player.id)}
                    style={{ color: isEditing ? '#f7b223' : '#b8d4f0', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
                  </button>
                  <button onClick={() => setConfirmDelete({ type: 'player', id: player.id, name: player.name })}
                    style={{ color: '#e85d4f', background: 'none', border: 'none', cursor: 'pointer' }}
                    title="Remove from saved roster">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>LIKES & DISLIKES</p>
                <div>
                  {allPrefs.map(pref => (
                    <PrefChip key={pref.id} pref={pref}
                      isOn={(player.preferences || []).includes(pref.id)}
                      onClick={() => togglePlayerPref(player.id, pref.id)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="mono-font label-dim" style={{ fontSize: '11px', letterSpacing: '0.1em', marginBottom: '6px' }}>NOTES</p>
                {isEditing ? (
                  <textarea value={player.notes || ''}
                    onChange={(e) => updatePlayer(player.id, { notes: e.target.value })}
                    style={{ width: '100%', background: '#0a1628', border: '1px solid #2a4970', color: '#ffffff', padding: '8px', fontSize: '14px', fontFamily: 'inherit', minHeight: '60px', resize: 'vertical' }} />
                ) : (
                  <p style={{ fontSize: '14px', color: player.notes ? '#ffffff' : '#7a92b8', fontStyle: player.notes ? 'normal' : 'italic' }}>
                    {player.notes || 'No notes.'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation modal */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 22, 40, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#15294a',
            border: '2px solid #e85d4f',
            padding: '24px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          }}>
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={24} style={{ color: '#e85d4f', flexShrink: 0 }} />
              <h3 className="display-font" style={{ fontSize: '22px', color: '#e85d4f', lineHeight: 1 }}>
                {confirmDelete.type === 'player' ? 'Remove Player?' : 'Delete Like/Dislike?'}
              </h3>
            </div>
            <p style={{ fontSize: '15px', color: '#ffffff', marginBottom: '8px', lineHeight: 1.5 }}>
              {confirmDelete.type === 'player' ? (
                <>Remove <strong style={{ color: '#f7b223' }}>{confirmDelete.name}</strong> from the saved roster?</>
              ) : (
                <>Delete <strong style={{ color: '#f7b223' }}>&ldquo;{confirmDelete.name}&rdquo;</strong> from your custom likes/dislikes?</>
              )}
            </p>
            <p className="label-dim" style={{ fontSize: '13px', marginBottom: '20px', fontStyle: 'italic', lineHeight: 1.5 }}>
              {confirmDelete.type === 'player'
                ? 'This will also remove them from tonight\'s lineup if they\'re on stage. Their saved preferences and notes will be lost. This cannot be undone.'
                : 'This will also remove it from every player who has it assigned. This cannot be undone.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="btn">
                CANCEL
              </button>
              <button onClick={handleConfirmedDelete} className="btn btn-danger"
                style={{ background: '#e85d4f', color: '#ffffff' }}>
                <Trash2 size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-top' }} />
                {confirmDelete.type === 'player' ? 'REMOVE PLAYER' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
