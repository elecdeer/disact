import type { APIMessageTopLevelComponent } from "discord-api-types/v10";
import { ComponentType } from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import { extractCustomIds } from "./extractCustomIds";

describe("extractCustomIds", () => {
  it("undefinedの場合は空配列を返す", () => {
    const result = extractCustomIds(undefined);
    expect(result).toEqual([]);
  });

  it("空配列の場合は空配列を返す", () => {
    const components: APIMessageTopLevelComponent[] = [];

    const result = extractCustomIds(components);
    expect(result).toEqual([]);
  });

  it("1つのButtonからcustomIdを抽出できる", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: 1,
            label: "Click",
            custom_id: "dsct|0|counter|5|6",
          },
        ],
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|counter|5|6"]);
  });

  it("複数のButtonからcustomIdを抽出できる", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: 1,
            label: "Increase",
            custom_id: "dsct|0|counter|5|6",
          },
          {
            type: ComponentType.Button,
            style: 1,
            label: "Decrease",
            custom_id: "dsct|0|counter|5|4",
          },
        ],
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|counter|5|6", "dsct|0|counter|5|4"]);
  });

  it("複数のActionRowからcustomIdを抽出できる", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: 1,
            label: "Button 1",
            custom_id: "dsct|0|counter|5|6",
          },
        ],
      } as APIMessageTopLevelComponent,
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: 1,
            label: "Button 2",
            custom_id: "dsct|1|page|2|3",
          },
        ],
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|counter|5|6", "dsct|1|page|2|3"]);
  });

  it("LinkButtonのようなcustom_idを持たないコンポーネントは無視する", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: 5, // LINK
            label: "Link",
            url: "https://example.com",
          },
          {
            type: ComponentType.Button,
            style: 1,
            label: "Button",
            custom_id: "dsct|0|counter|5|6",
          },
        ],
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|counter|5|6"]);
  });

  it("SelectMenuからもcustomIdを抽出できる", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect,
            custom_id: "dsct|0|select|option1|option2",
            options: [],
          },
        ],
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|select|option1|option2"]);
  });

  it("Container内のActionRowからcustomIdを抽出できる", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.Container,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: 1,
                label: "Container Button",
                custom_id: "dsct|0|container-btn|0|1",
              },
            ],
          } as APIMessageTopLevelComponent,
        ],
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|container-btn|0|1"]);
  });

  it("Container内の複数のコンポーネントからcustomIdを抽出できる", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.Container,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: 1,
                label: "Button 1",
                custom_id: "dsct|0|btn1|0|1",
              },
            ],
          } as APIMessageTopLevelComponent,
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.StringSelect,
                custom_id: "dsct|1|select1|a|b",
                options: [],
              },
            ],
          } as APIMessageTopLevelComponent,
        ],
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|btn1|0|1", "dsct|1|select1|a|b"]);
  });

  it("SectionのaccessoryにButtonがある場合customIdを抽出できる", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: "Section text",
          },
        ],
        accessory: {
          type: ComponentType.Button,
          style: 1,
          label: "Section Button",
          custom_id: "dsct|0|section-btn|0|1",
        },
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|section-btn|0|1"]);
  });

  it("SectionのaccessoryがThumbnailの場合はcustomIdを抽出しない", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: "Section text",
          },
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: {
            url: "https://example.com/image.png",
          },
        },
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual([]);
  });

  it("複雑な構造（Container + ActionRow + Section）からcustomIdを抽出できる", () => {
    const components: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: 1,
            label: "Top Button",
            custom_id: "dsct|0|top|0|1",
          },
        ],
      } as APIMessageTopLevelComponent,
      {
        type: ComponentType.Container,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: 1,
                label: "Container Button",
                custom_id: "dsct|1|container|0|1",
              },
            ],
          } as APIMessageTopLevelComponent,
          {
            type: ComponentType.Section,
            components: [
              {
                type: ComponentType.TextDisplay,
                content: "Section text",
              },
            ],
            accessory: {
              type: ComponentType.Button,
              style: 1,
              label: "Section Button",
              custom_id: "dsct|2|section|0|1",
            },
          } as APIMessageTopLevelComponent,
        ],
      } as APIMessageTopLevelComponent,
    ];

    const result = extractCustomIds(components);
    expect(result).toEqual(["dsct|0|top|0|1", "dsct|1|container|0|1", "dsct|2|section|0|1"]);
  });
});
