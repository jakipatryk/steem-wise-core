// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Promise } from "bluebird";
import * as steem from "steem";

// wise imports
import { SimpleTaker } from "../src/chainable/Chainable";
import { SteemOperationNumber, SteemOperation, Wise } from "../src/wise";
import { SteemJsAccountHistorySupplier } from "../src/api/directblockchain/SteemJsAccountHistorySupplier";
import { OperationNumberFilter } from "../src/chainable/filters/OperationNumberFilter";
import { ToSmartvotesOperationTransformer } from "../src/chainable/transformers/ToSmartvotesOperationTransformer";
import { DisabledApi } from "../src/api/DisabledApi";
import { ChainableLimiter } from "../src/chainable/limiters/ChainableLimiter";


describe("test/chainable.spec.ts", () => {
    describe("SteemJsAccountHistorySupplier", () => {
        describe("SteemJsAccountHistorySupplier [username = steemprojects1]", () => {
            const wise = new Wise("steemprojects1", new DisabledApi());
            const protocol = wise.getProtocol();

            const steemprojects1Operations: SteemOperation [] = [];

            before(function(done) {
                this.timeout(15000);
                new SteemJsAccountHistorySupplier(steem, "steemprojects1")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new OperationNumberFilter("<_solveOpInTrxBug", new SteemOperationNumber(22202938, 14, 1))) // ensure no one will be able to manipulate test results by voting
                    .chain(new ToSmartvotesOperationTransformer(protocol))
                    .chain(new ChainableLimiter(6))
                    .chain(new SimpleTaker((item: SteemOperation): boolean => {
                        steemprojects1Operations.push(item);
                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        done(error);
                        return false;
                    });
                })
                .start(() => done());
            });

            it("Returns exactly 6 operations", () => {
                expect(steemprojects1Operations.length).to.be.equal(6);
            });
        });

        describe("AccountHistorySupplier [username = guest123]", () => {
            const realAndVirtual: string [] = [
                "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
                "falf",
                "20180411162422237-diceroll",
                "top-5-cities-in-bangladesh",
                "what-makes-you-you-secret-of-individuality-and-uniqueness"
            ];

            it("Loads both real and virtual operations", function(done) {
                this.timeout(25000);
                new SteemJsAccountHistorySupplier(steem, "guest123")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new OperationNumberFilter("<_solveOpInTrxBug", new SteemOperationNumber(22202938, 14, 1))) // ensure no one will be able to manipulate test results by voting
                    .chain(new SimpleTaker((rawOp: SteemOperation): boolean => {
                        if (rawOp.op[0] !== "vote") return true;

                        const vote: {permlink: string} = rawOp.op[1] as {permlink: string} ;

                        const indexInSamples: number = realAndVirtual.indexOf(vote.permlink);
                        if (indexInSamples !== -1) {
                            realAndVirtual.splice(indexInSamples, 1);
                            if (realAndVirtual.length == 0) {
                                return false;
                            }
                        }

                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        console.error(error);
                        done(error);
                        return false;
                    });
                })
                .start(() => {
                    if (realAndVirtual.length > 0) {
                        console.error(new Error("Not all votes were loaded: missing: " + JSON.stringify(realAndVirtual)));
                        done(new Error("Not all votes were loaded: missing: " + JSON.stringify(realAndVirtual)));
                    }
                    else {
                        done();
                    }
                    /* tslint:disable no-null-keyword */
                });
            });

            const randomVoteOperationsInDescendingTimeOrder: string [] = [
                "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
                "falf",
                "20180411162422237-diceroll",
                "top-5-cities-in-bangladesh",
                "what-makes-you-you-secret-of-individuality-and-uniqueness"
            ];

            it("Loads operations in correct order", function(done) {
                this.timeout(25000);
                new SteemJsAccountHistorySupplier(steem, "guest123")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new OperationNumberFilter("<", new SteemOperationNumber(22202938, 14, 1))) // ensure no one will be able to manipulate test results by voting
                    .chain(new SimpleTaker((rawOp: SteemOperation): boolean => {
                        if (rawOp.op[0] !== "vote") return true;

                        const vote: {permlink: string} = rawOp.op[1] as {permlink: string};

                        const indexInSamples: number = randomVoteOperationsInDescendingTimeOrder.indexOf(vote.permlink);
                        if (indexInSamples !== -1) {
                            if (indexInSamples !== 0) {
                                const error = new Error("Votes returned in wrogn order. Received " + vote.permlink + ", sholudReceive: " + randomVoteOperationsInDescendingTimeOrder[0]);
                                console.error(error);
                                done(error);
                                return false;
                            }
                            else {
                                randomVoteOperationsInDescendingTimeOrder.shift();
                                if (randomVoteOperationsInDescendingTimeOrder.length == 0) {
                                    return false;
                                }
                            }
                        }

                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        console.error(error);
                        done(error);
                        return false;
                    });
                })
                .start(() => {
                    if (randomVoteOperationsInDescendingTimeOrder.length > 0) {
                        done(new Error("Not all votes were loaded: missing: " + JSON.stringify(randomVoteOperationsInDescendingTimeOrder)));
                    }
                    else done();
                });
            });
        });
    });

    describe("OperationNumberFilter", () => {
        it("returns only operations with number < (block=22202938, tx=14, op=1)", function(done) {
            this.timeout(35000);
            new Promise((resolve, reject) => {
                new SteemJsAccountHistorySupplier(steem, "guest123")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new OperationNumberFilter("<_solveOpInTrxBug", new SteemOperationNumber(22202938, 14, 1)))
                    .chain(new SimpleTaker((rawOp: SteemOperation): boolean => {
                        if (rawOp.block_num > 22202938) {
                            reject(new Error("Operation outside of scope was passed: " + SteemOperationNumber.fromOperation(rawOp).toString()));
                            return false;
                        }
                        else if (rawOp.block_num == 22202938 && rawOp.transaction_num > 14) {
                            reject(new Error("Operation outside of scope was passed: " +  + SteemOperationNumber.fromOperation(rawOp).toString()));
                            return false;
                        }
                        else if (rawOp.block_num == 22202938 && rawOp.transaction_num == 14 && rawOp.operation_num >= 1) {
                            reject(new Error("Operation outside of scope was passed: " + SteemOperationNumber.fromOperation(rawOp).toString()));
                            return false;
                        }

                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        reject(error);
                        return false;
                    });
                })
                .start(() => {
                    resolve();
                });
            })
            .then(() => done())
            .catch((error: Error) => done(error));
        });
    });
});