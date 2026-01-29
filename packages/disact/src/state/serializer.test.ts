import { describe, expect, it } from "vitest";
import { createDefaultSerializer } from "./serializer";

describe("createDefaultSerializer", () => {
	it("should serialize and deserialize number", () => {
		const serializer = createDefaultSerializer<number>();
		const value = 42;
		const serialized = serializer.serialize(value);
		expect(serialized).toBe("42");
		expect(serializer.deserialize(serialized)).toBe(value);
	});

	it("should serialize and deserialize string", () => {
		const serializer = createDefaultSerializer<string>();
		const value = "hello world";
		const serialized = serializer.serialize(value);
		expect(serialized).toBe('"hello world"');
		expect(serializer.deserialize(serialized)).toBe(value);
	});

	it("should serialize and deserialize object", () => {
		const serializer = createDefaultSerializer<{ count: number; page: number }>();
		const value = { count: 10, page: 2 };
		const serialized = serializer.serialize(value);
		expect(serialized).toBe('{"count":10,"page":2}');
		expect(serializer.deserialize(serialized)).toEqual(value);
	});

	it("should serialize and deserialize array", () => {
		const serializer = createDefaultSerializer<number[]>();
		const value = [1, 2, 3, 4, 5];
		const serialized = serializer.serialize(value);
		expect(serialized).toBe("[1,2,3,4,5]");
		expect(serializer.deserialize(serialized)).toEqual(value);
	});

	it("should serialize and deserialize null", () => {
		const serializer = createDefaultSerializer<null>();
		const value = null;
		const serialized = serializer.serialize(value);
		expect(serialized).toBe("null");
		expect(serializer.deserialize(serialized)).toBe(value);
	});

	it("should serialize and deserialize boolean", () => {
		const serializer = createDefaultSerializer<boolean>();
		const trueValue = true;
		const falseValue = false;

		const serializedTrue = serializer.serialize(trueValue);
		expect(serializedTrue).toBe("true");
		expect(serializer.deserialize(serializedTrue)).toBe(trueValue);

		const serializedFalse = serializer.serialize(falseValue);
		expect(serializedFalse).toBe("false");
		expect(serializer.deserialize(serializedFalse)).toBe(falseValue);
	});

	it("should handle complex nested object", () => {
		type ComplexType = {
			id: number;
			name: string;
			items: Array<{ id: number; label: string }>;
			metadata: { createdAt: string; tags: string[] };
		};

		const serializer = createDefaultSerializer<ComplexType>();
		const value: ComplexType = {
			id: 1,
			name: "Test",
			items: [
				{ id: 1, label: "Item 1" },
				{ id: 2, label: "Item 2" },
			],
			metadata: {
				createdAt: "2024-01-01",
				tags: ["tag1", "tag2"],
			},
		};

		const serialized = serializer.serialize(value);
		const deserialized = serializer.deserialize(serialized);
		expect(deserialized).toEqual(value);
	});
});
