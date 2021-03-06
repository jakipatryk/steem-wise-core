# Steem WISE (core library)

Vote delegation system for STEEM blockchain: common library for browser & node.

Currently, it is used by the following tools:

- [steem-wise-cli](https://github.com/noisy-witness/steem-wise-cli) — CLI tool for vote delegators
- [steem-wise-voter-page](https://github.com/noisy-witness/steem-wise-voter-page) — Simple HTML page that allows a voter to vote on behalf of a delegator. 

Online tools:

- [Voter page](https://noisy-witness.github.io/steem-wise-voter-page) — you can vote using this page



## What will WISE do for the community?

An ultimate cure for cancer was the biggest holy grail of medicine for decades. However time has shown, that instead of ultimate cure, there are many potent, but narrow-targeted drugs. So are counter-abuse mechanisms in Steem network. 

One of biggest advantages of steem is that it utilizes human resources to distinguish between good and bad content. People are encouraged to vote and flag by financial reward. It is designed to resist most of the abuses, however, there are people who somehow try to bend the rules. Moreover, there are users, who, create imprecise and misleading content in professional fields. Even though they do it in a good faith, it is almost impossible for a layman to tell if professionally looking pseudo-scientific article tells the truth or not. Another problem is that it is hard for minnows to join forces in a vote-flag fight with a malicious whale. These are some of the wide variety of steem community problems. Probably there won't by any single tool to treat them all, but as with cancer drugs, there are many wise, narrow-targeted initiatives. Among them the WISE system is here, to even the odds in a fight with:

- Misleading pseudo-science — by allowing the community to appoint professional authorities to a position of curators in the field of their knowledge
- Abusive whales — through the ability to join forces of many minnows under common leadership



## What will WISE do for you (if you are a delegator)?

In steem, the best voting strategy is to vote 10 times per 24 hours. Each vote decreases your voting power by 2%pp (percentage points). Each 24h 20%pp is restored progressively. The best strategy is to oscillate between 80%-100% of VP. To sum up: if you vote more than 10 votes/24h, your VP will not restore to 100%, but if you vote less than 10 times, your VP will only restore to 100% and not higher, so it means that you have wasted your votes. With WISE:

- You can delegate a static amount of votes (eg. 150% means 1.5 of full votes or three 50% votes)
- You can delegate static amount of vote, but only in a situation when you have a specific amount of votes still left and it is going to waste.

WISE can also boost your voting earnings: If you delegate your votes to a professional authority it is more likely that the post he will choose will become more popular.



## What will WISE do for you (if you are a voter)?

If you have read preceding paragraphs, you see, that the voter is a most important part of this ecosystem. You may think — what will be my profit if I become a voter? In fact, it will not only boost your prestige & significance in the community but also allows you to earn money for being an early curator (you have to remember about early voter penalty for the first 30 minutes). Benefits of using WISE as a voter:

- Prestige & significance — power makes you noticeable. You can use it to build your personal brand and gain followers. You can become a tag curator if many people delegate you a WISEvote.
- First curator reward — you can vote with your vote first & then vote as a delegator (which often will be a whale or a big group of minnow delegators). This makes your vote more rewarded.



## How to use

Add this library to your npm project:

```bash
$ npm install --save steem-wise-core
```

Send voteorder:

```js
let wise = require('steem-wise-core');

let voter = "jblew";
let postingWif = "...";
let voterWise = new wise.Wise(voter, new wise.DirectBlockchainApi(voter, postingWif));

let delegator = "noisy";
let voteorder = {
    rulesetName: "co robia lekarze w kuchni? Leczo!",
    author: "article-author",
    permlink: "article-permlink",
    weight: 10000
};
voterWise.sendVoteorderAsync(delegator, voteorder)
.then(moment => console.log("Voteorder sent in block " + moment.blockNum))
.catch(error => console.error(error));
```



## Details

### Name convention

- a **delegator** — a person who allows someone to use his/her vote by specific criteria.
- a **voter** — a person who votes on behalf of a delegator



### Blockchain transactions

For safe and reliable communication WISE simply puts all operations on Steem blockchain. It is done using **custom_json** operation. Syntax and allowed operations are defined in **/protocol/versions/[vX]** dirs. Definitions are written in Typescript and then converted into json-schema.





## More resources on voting in Steem

- [steemit.com/steem/@dantheman/curation-rewards-and-voting-incentive](https://steemit.com/steem/@dantheman/curation-rewards-and-voting-incentive)
- [steemit.com/utopian-io/@nationalpark/how-to-maximize-steem-voting-rewards](https://steemit.com/utopian-io/@nationalpark/how-to-maximize-steem-voting-rewards)
- [steemit.com/steem/@abit/new-curation-reward-algorithm-huge-penalty-to-early-voters](https://steemit.com/steem/@abit/new-curation-reward-algorithm-huge-penalty-to-early-voters)



## Like the project? Let @noisy-witness become your favourite witness!

If you use & appreciate our software — you can easily support us. Just cast a vote for "noisy-witness" on your steem account. You can do it here: [https://steemit.com/~witnesses](https://steemit.com/~witnesses).



## Thank you

I send many thanks to the authors of vendor dependencies of the project. You are the ones, who made the development of this tool so joyful and smooth. Many thanks to the contributors of:

- [steem](https://github.com/steemit/steem)
- [ajv](https://github.com/epoberezkin/ajv)
- [json-schema](http://json-schema.org/)
- [typescript](https://github.com/Microsoft/TypeScript)
- [typescript-json-schema](https://github.com/YousefED/typescript-json-schema)
- [webpack](https://webpack.js.org/)
- [mocha](https://mochajs.org/) & [chai](http://www.chaijs.com/)

There are separate thanks in each project's README.
