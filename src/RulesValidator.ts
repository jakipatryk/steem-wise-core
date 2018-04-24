import * as ajv from "ajv";
import * as schemaJSON from "../smartvotes.schema.json";
import { smartvotes_rule, smartvotes_ruleset } from "./schema/rules.schema";
import * as filter from "./blockchain-filter";
import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc } from "./schema/smartvotes.schema";
    import { SteemPost } from "./blockchain-operations-types";

import { JSONValidator } from "./JSONValidator";
import { Promise } from "bluebird";

/**
 * The RulesValidator validates vote orders against delegator's rulesets.
 */
export class RulesValidator {
    /**
     * Fetches smartvotes rules of specified steem user, which were valid at
     * specified time (could be now — 'new Date()')
     * @param {string} username — a steem username of the Delegator
     * @param {Date} beforeDate - the latest date and time of returned rules
     *  If you specify past date — the result will be the rules which were valid at that moment
     * @param {(error: Error | undefined, result: smartvotes_ruleset []) => void} callback — a callback (can be promisified)
     */
    public static getRulesOfUser(username: string, beforeDate: Date, callback: (error: Error | undefined, result: smartvotes_ruleset []) => void): void {
        if (typeof username === "undefined" || username.length == 0) { callback(new Error("Username must not be empty"), []); return; }

        filter.getOperationsBeforeDate(username, ["set_rules"], 1, beforeDate, function(error: Error, result: smartvotes_operation []): void {
            if (error) {
                callback(error, []);
            }
            else if (result.length == 0) {
                callback(undefined, []);
            }
            else {
                callback(undefined, (result[0] as smartvotes_command_set_rules).rulesets);
            }
        });
    }

    // TODO fail on nonexistent post
    // TODO split validation to separate functions
    /**
     * Validates a vote order which was or possibly will be sent by specified user. The vote order
     *  should specify a name of the ruleset against which it will be validated, and which was
     *  set in the newest (at publishDate moment) set_rules of the Delegator
     * @param {string} username — a steem username of the Voter
     * @param {smartvotes_voteorder} voteorder  — a voteorder object
     * @param {Date} publishDate — a past datetime of the publication of send_voteorder (date
     * from blockchain operation timestamp) or (now — 'new Date()') if it is a potential vote order
     * @param {(error: Error | undefined, result: boolean) => void} callback — a callback (can be promisified)
     */
    public static validateVoteOrder(username: string, voteorder: smartvotes_voteorder, publishDate: Date, callback: (error: Error | undefined, result: boolean) => void): void {
        if (typeof voteorder === "undefined") { callback(new Error("Voteorder must not be empty"), false); return; }
        if (typeof voteorder.delegator === "undefined" || voteorder.delegator.length == 0) { callback(new Error("Delegator must not be empty"), false); return; }
        if (typeof voteorder.ruleset_name === "undefined" || voteorder.ruleset_name.length == 0) { callback(new Error("Ruleset_name must not be empty"), false); return; }
        if (typeof voteorder.author === "undefined" || voteorder.author.length == 0) { callback(new Error("Author must not be empty"), false); return; }
        if (typeof voteorder.permlink === "undefined" || voteorder.permlink.length == 0) { callback(new Error("Permlink must not be empty"), false); return; }
        if (typeof voteorder.type === "undefined" || voteorder.type.length == 0) { callback(new Error("Type must not be empty"), false); return; }
        if (!(voteorder.type === "upvote" || voteorder.type === "flag")) { callback(new Error("Type must be: upvote or flag"), false); return; }
        if (typeof voteorder.weight === "undefined") { callback(new Error("Weight must not be empty"), false); return; }
        if (voteorder.weight <= 0) { callback(new Error("Weight must be greater than zero"), false); return; }
        if (voteorder.weight > 10000) { callback(new Error("Weight must be lesser or equal 10000"), false); return; }

        Promise.promisify(RulesValidator.getRulesOfUser)(voteorder.delegator, publishDate). then( function (rulesets: smartvotes_ruleset []): smartvotes_ruleset {
            for (const i in rulesets) {
                if (rulesets[i].name == voteorder.ruleset_name) {
                    return rulesets[i];
                }
            }
            throw new Error("Delegator had no such ruleset at " + publishDate);
        }). then( function (ruleset: smartvotes_ruleset): smartvotes_ruleset {
            if (ruleset.voter !== username) throw new Error("This ruleset do not allow " + username + " to vote.");

            if (ruleset.action !== "upvote+flag") {
                if (voteorder.type === ruleset.action) throw new Error("This ruleset do not allow " + voteorder.type + "action");
            }

            // TODO total vote weight calculator
            if (voteorder.weight > ruleset.total_weight) throw new Error("Total vote weight allowed by this ruleset was exceeded.");

            return ruleset;
        })
        .then(function(ruleset: smartvotes_ruleset): Promise<{ ruleset: smartvotes_ruleset, post: SteemPost }> {
            return new Promise(function(resolve, reject) {
                filter.loadPost(voteorder.author, voteorder.permlink, function(error: Error | undefined, result: SteemPost) {
                    if (error) throw error;
                    else resolve({ ruleset: ruleset, post: result });
                });
            });
        })
        .then(function(data: { ruleset: smartvotes_ruleset, post: SteemPost }) {
            const ruleset = data.ruleset;
            const post = data.post;

            const validationPromises: Promise<boolean> [] = [];
            for (const i in ruleset.rules) {
                switch (ruleset.rules[i].type) {
                    case "authors":
                        validationPromises.push(new AuthorsRuleValidator()
                            .validate(voteorder, ruleset.rules[i] as smartvotes_rule_authors, post));
                        break;

                    case "tags":
                        validationPromises.push(new TagsRuleValidator()
                            .validate(voteorder, ruleset.rules[i] as smartvotes_rule_tags, post));
                        break;

                    case "custom_rpc":
                        validationPromises.push(new CustomRPCRuleValidator()
                            .validate(voteorder, ruleset.rules[i] as smartvotes_rule_custom_rpc, post));
                        break;

                    default:
                        throw new Error("Unknown rule type: " + ruleset.rules[i].type);
                }
            }
            return Promise.all(validationPromises);
        }).then(function(values: any) {
            const validityArray: boolean [] = values as boolean [];
            for (const i in validityArray) {
                if (!validityArray[i]) throw new Error("Rule validation failed");
            }
        })
        .catch(error => callback(error, false));
    }
}

/**
 * Abstract class for Rule Validators. A rule validator is specific for
 * type smartvotes_rule (src/schema/rules.schema.ts). Switch for rule validation is
 * in RulesValidator.validateVoteOrder.
 */
abstract class RuleValidator {
    public abstract validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule, post: SteemPost): Promise<boolean>;
}

/**
 * Validator for smartvotes_rule_authors (defined in src/schema/rules.schema.ts).
 */
class AuthorsRuleValidator extends RuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_authors, post: SteemPost): Promise<boolean> {
        return new Promise(function(resolve, reject) {
            const allowMode = (rule.mode == "allow");
            const authorIsOnList: boolean = (rule.authors.indexOf(post.author) !== -1);
            if (allowMode) {
                if (authorIsOnList) resolve();
                else throw new Error("Author of the post is not on the allow list.");
            }
            else {
                if (authorIsOnList) throw new Error("Author of the post is on the deny list.");
                else resolve();
            }
        });
    }
}

/**
 * Validator for smartvotes_rule_tags (defined in src/schema/rules.schema.ts).
 */
class TagsRuleValidator extends RuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_tags, post: SteemPost): Promise<boolean> {
        throw new Error("Not implemented yet");
    }
}

/**
 * Validator for smartvotes_rule_custom_rpc (defined in src/schema/rules.schema.ts).
 */
class CustomRPCRuleValidator extends RuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_custom_rpc, post: SteemPost): Promise<boolean> {
        throw new Error("Not implemented yet");
    }
}