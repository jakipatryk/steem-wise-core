import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SteemPost } from "../blockchain/SteemPost";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { NotFoundException } from "../util/NotFoundException";
import { Promise } from "bluebird";

export class TagsRule extends Rule {
    public rule: string = Rule.Type.Tags;
    public tags: string [];
    public mode: TagsRule.Mode;

    public constructor(mode: TagsRule.Mode, tags: string []) {
        super();

        this.mode = mode;
        this.tags = tags;
    }

    public type(): Rule.Type {
        return Rule.Type.Tags;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return Promise.resolve()
        .then(() => {
            if (!this.mode) throw new ValidationException("Tags rule: mode is missing");
            if (!this.tags) throw new ValidationException("Tags rule: tags are missing");
        })
        .then(() => context.getPost())
        .then((post: SteemPost) => {
                const postMetadata: SteemPost.JSONMetadata = JSON.parse(post.json_metadata) as SteemPost.JSONMetadata;

                if (this.mode === TagsRule.Mode.ALLOW) { // allow mode (every post tag must be within this list)
                    for (let i = 0; i < postMetadata.tags.length; i++) {
                        const tag = postMetadata.tags[i];
                        if (this.tags.indexOf(tag) === -1)
                            throw new ValidationException("Tag " + tag + " is not on the allowed tags list [" + this.tags.join() + "].");
                    }
                }
                else if (this.mode === TagsRule.Mode.DENY) { // deny mode (none of post tags can be on this list)
                    for (let i = 0; i < postMetadata.tags.length; i++) {
                        const tag = postMetadata.tags[i];
                        if (this.tags.indexOf(tag) !== -1)
                            throw new ValidationException("Tag " + tag + " is on the denied tags list [" + this.tags.join() + "].");
                    }
                }
                else if (this.mode === TagsRule.Mode.REQUIRE) { // the post should have all of the specified tags
                    for (let i = 0; i < this.tags.length; i++) {
                        const tag = this.tags[i];
                        if (postMetadata.tags.indexOf(tag) === -1)
                            throw new ValidationException("The post tags [" + postMetadata.tags.join() + "] does not include " + tag + ".");
                    }
                }
                else if (this.mode === TagsRule.Mode.ANY) { // the post should have at least one of the specified tags
                    for (let i = 0; i < this.tags.length; i++) {
                        const tag = this.tags[i];
                        if (postMetadata.tags.indexOf(tag) !== -1) {
                            return;
                        }
                    }
                    throw new ValidationException("None of the tags [" + postMetadata.tags.join() + "] is on the \"require\" tags list [" + this.tags.join() + "].");
                }
                else throw new ValidationException("Unknown mode in tags.");
        })
        .catch((e: Error) => {
            if ((e as NotFoundException).notFoundException) throw new Error(e.message);
            else throw e;
        });
    }

    public getRequiredProperties(): string [] {
        return ["tags", "mode"];
    }
}

export namespace TagsRule {
    export enum Mode {
        ALLOW = "allow",
        DENY = "deny",
        ANY = "any",
        REQUIRE = "require"
    }
}