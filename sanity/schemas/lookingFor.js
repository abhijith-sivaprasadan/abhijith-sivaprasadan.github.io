// Singleton document — the "Looking for…" status banner that appears on every page.
module.exports = {
  name: "lookingFor",
  title: "Looking for (status banner)",
  type: "document",
  __experimental_actions: ["update", "publish"], // singleton: no create / delete
  fields: [
    {
      name: "active",
      title: "Banner active?",
      type: "boolean",
      initialValue: true,
      description: "Untoggle to hide the banner site-wide.",
    },
    {
      name: "message",
      title: "Message (HTML allowed)",
      type: "text",
      rows: 2,
      description:
        'e.g. "Currently targeting PhD positions and industrial R&D roles in Sweden and the EU." HTML <a href> links are supported.',
      validation: (Rule) => Rule.required().max(280),
    },
    {
      name: "messageSv",
      title: "Message — Swedish",
      type: "text",
      rows: 2,
      description: "Same content in Swedish; shown when the locale toggle is set to sv.",
    },
    {
      name: "tone",
      title: "Tone",
      type: "string",
      options: {
        list: [
          { title: "Default (gradient)", value: "default" },
          { title: "Active (green pulse)", value: "active" },
          { title: "Quiet (just text)", value: "quiet" },
        ],
        layout: "radio",
      },
      initialValue: "active",
    },
    {
      name: "expiresAt",
      title: "Expires at (optional)",
      type: "datetime",
      description: "Hide the banner after this date; leave empty for indefinite.",
    },
  ],
};
