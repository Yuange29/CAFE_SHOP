import { registerDecorator, ValidationOptions } from "class-validator";

interface StringRecordOption {
    maxKeys?: number;
    maxKeyLenght?: number;
    maxValueLenght?: number;
}

export function IsStringRecord(
    {
        maxKeys = 20,
        maxKeyLenght = 50,
        maxValueLenght = 200,
    }: StringRecordOption = {},
    validationOption?: ValidationOptions,
) {
    return (object: object, propertyName: string) =>
        registerDecorator({
            name: "isStringRecord",
            target: object.constructor,
            propertyName,
            options: validationOption,
            validator: {
                validate(value: unknown) {
                    if (
                        typeof value !== "object" ||
                        value === null ||
                        Array.isArray(value)
                    ) {
                        return false;
                    }
                    const entries = Object.entries(value);

                    return (
                        entries.length < maxKeys &&
                        entries.every(
                            ([k, v]) =>
                                k.length > 0 &&
                                k.length <= maxKeyLenght &&
                                typeof v === "string" &&
                                v.length <= maxValueLenght,
                        )
                    );
                },
                defaultMessage: () =>
                    `${propertyName} is not a string record or it reach max key lenght`,
            },
        });
}
