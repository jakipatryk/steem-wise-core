import { SetRules } from "./SetRules";
import { ConfirmVote } from "./ConfirmVote";

export interface SendVoteorder {
    rulesetName: string;
    permlink: string;
    author: string;
    weight: number;
}

/**
 * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
 */
export function isSendVoteorder(cmd: SetRules | SendVoteorder | ConfirmVote): cmd is SendVoteorder {
    return (<SendVoteorder>cmd).rulesetName !== undefined
        && (<SendVoteorder>cmd).permlink !== undefined
        && (<SendVoteorder>cmd).author !== undefined
        && (<SendVoteorder>cmd).weight !== undefined;
}