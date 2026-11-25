const assert = require("node:assert/strict");
const test = require("node:test");

const { UserService } = require("../dist/user/user.service.js");

test("findById queries using the User entity primary key", async () => {
    let whereClause;
    const user = { id: "user-1" };
    const queryBuilder = {
        leftJoinAndSelect() {
            return this;
        },
        where(clause, parameters) {
            whereClause = { clause, parameters };
            return this;
        },
        async getOne() {
            return user;
        },
    };
    const service = new UserService(
        { createQueryBuilder: () => queryBuilder },
        {},
    );

    const result = await service.findById("user-1");

    assert.deepEqual(whereClause, {
        clause: "user.id = :userId",
        parameters: { userId: "user-1" },
    });
    assert.equal(result, user);
});
