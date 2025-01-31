import { readValue } from "../../validate/rows";

describe("TEST SCHEMA", () => {
  it("validate suffixe", async () => {
    const result = await readValue("suffixe", "ter");

    expect(result.parsedValue).toBe("ter");
    expect(result.errors).toEqual([]);
  });
});
