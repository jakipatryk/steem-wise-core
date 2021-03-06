// 3rd party imports
import "mocha";
import * as _ from "lodash";

// wise imports
import { SendVoteorder, Wise, WeightRule } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";
import { FakeApi } from "../src/api/FakeApi";


/* PREPARE TESTING DATASETS */
import * as fakeDataset_ from "./data/fake-blockchain.json";
const fakeDataset = fakeDataset_ as object as FakeApi.Dataset;

/* CONFIG */
const delegator = "noisy";
const voter = "perduta";
const fakeApi: FakeApi = FakeApi.fromDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);


describe("test/rule-weight.spec.ts", () => {
    describe("WeightRule", () => {
        const voteorder: SendVoteorder = {
            rulesetName: "",
            weight: 1,
            author: "noisy",
            permlink: "nonexistent-post-" + Date.now()
        };
        const context = new ValidationContext(fakeApi, delegator, voter, voteorder);

        describe("mode = SINGLE_VOTE_WEIGHT", () => {
            it ("allows 0 <= 50 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 50);
                return rule.validate(vo, context);
            });

            it ("allows 0 <= 0 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
                return rule.validate(vo, context);
            });

            it ("allows 0 <= 100 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
                return rule.validate(vo, context);
            });

            it ("allows -100 <= 0 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, -100, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
                return rule.validate(vo, context);
            });

            it ("allows -100 <= -100 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, -100, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", -100);
                return rule.validate(vo, context);
            });

            it ("rejects -100 <= -101 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, -100, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", -101);
                return rule.validate(vo, context)
                .then(() => { throw new Error("Should fail"); }, () => {});
            });

            it ("rejects -100 <= 101 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, -100, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 101);
                return rule.validate(vo, context)
                .then(() => { throw new Error("Should fail"); }, () => {});
            });

            it ("rejects 10 <= 0 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 10, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
                return rule.validate(vo, context)
                .then(() => { throw new Error("Should fail"); }, () => {});
            });
        });
    });
});
