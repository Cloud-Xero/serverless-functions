type Annotations = {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
};

export interface DatabaseInfo {
  object: 'database';
  id: string;
  cover: string | null;
  icon: string | null;
  created_time: string;
  created_by: {
    object: string;
    id: string;
  };
  last_edited_by: {
    object: string;
    id: string;
  };
  last_edited_time: string;
  title: {
    type: string;
    text: {
      content: string | null;
      link: string | null;
    };
    annotations: Annotations;
    plain_text: string;
    href: string | null;
  }[];
  description: string[];
  is_inline: boolean;
  properties: {
    'Posting Date': {
      id: string;
      name: 'Posting Date';
      type: 'date';
      date: Record<string, never>;
    };
    'Created time': {
      id: string;
      name: 'Created time';
      type: 'created_time';
      created_time: Record<string, never>;
    };
    Caption: {
      id: string;
      name: 'Caption';
      type: 'rich_text';
      rich_text: Record<string, never>;
    };
    'Last edited time': {
      id: string;
      name: 'Last edited time';
      type: 'last_edited_time';
      last_edited_time: Record<string, never>;
    };
    Type: {
      id: string;
      name: 'Type';
      type: 'select';
      select: {
        options: [
          {
            id: 'string';
            name: 'Feed';
            color: string;
            description: string | null;
          },
          {
            id: 'string';
            name: 'Story';
            color: string;
            description: string | null;
          },
          {
            id: 'string';
            name: 'Reel';
            color: string;
            description: string | null;
          },
          {
            id: 'string';
            name: 'Live';
            color: string;
            description: string | null;
          },
        ];
      };
    };
    Status: {
      id: string;
      name: 'Status';
      type: 'status';
      status: {
        options: [
          {
            id: string;
            name: 'Not started';
            color: string;
            description: string | null;
          },
          {
            id: string;
            name: 'Publish';
            color: string;
            description: string | null;
          },
          {
            id: string;
            name: 'Published';
            color: string;
            description: string | null;
          },
          {
            id: string;
            name: 'Unpublish';
            color: string;
            description: string | null;
          },
        ];
        groups: [
          {
            id: string;
            name: 'To-do';
            color: string;
            option_ids: string[];
          },
          {
            id: string;
            name: 'In progress';
            color: string;
            option_ids: string[];
          },
          {
            id: string;
            name: 'Complete';
            color: string;
            option_ids: string[];
          },
        ];
      };
      Number: {
        id: string;
        name: 'Number';
        type: 'number';
        number: {
          format: number;
        };
      };
      Tags: {
        id: string;
        name: 'Tags';
        type: 'rich_text';
        rich_text: Record<string, never>;
      };
      Thumbnail: {
        id: string;
        name: 'Thumbnail';
        type: 'files';
        rich_text: Record<string, never>;
      };
      'Posted Date': {
        id: string;
        name: 'Posted Date';
        type: 'date';
        rich_text: Record<string, never>;
      };
      Title: {
        id: string;
        name: 'Title';
        type: 'title';
        rich_text: Record<string, never>;
      };
    };
  };
  parent: {
    type: 'page_id';
    page_id: string;
  };
  url: string;
  public_url: string;
  archived: boolean;
  developer_survey: string;
}

export interface RecordInfo {
  object: 'list';
  results: {
    object: 'page';
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: {
      object: string;
      id: string;
    };
    last_edited_by: {
      object: string;
      id: string;
    };
    cover: string | null;
    icon: string | null;
    parent: {
      type: 'database_id';
      database_id: string;
    };
    archived: boolean;
    properties: {
      'Posting Date': {
        id: string;
        type: 'date';
        date: {
          start: string;
          end: string | null;
          time_zone: string | null;
        };
      };
      'Created time': {
        id: string;
        type: 'created_time';
        created_time: string;
      };
      Caption: {
        id: string;
        type: 'rich_text';
        rich_text: [
          {
            type: 'text';
            text: {
              content: string;
              link: string | null;
            };
            annotations: Annotations;
            plain_text: string;
            href: string | null;
          },
        ];
      };
      'last edited time': {
        id: string;
        type: 'last_edited_time';
        last_edited_time: string;
      };
      Type: {
        id: string;
        type: 'select';
        select: {
          id: string;
          name: string;
          color: string;
        };
      };
      Status: {
        id: string;
        type: 'status';
        status: {
          id: string;
          name: 'Not started';
          color: string;
        };
      };
      Number: {
        id: string;
        type: 'number';
        number: number;
      };
      Tags: {
        id: string;
        type: 'rich_text';
        rich_text: [
          {
            type: 'text';
            text: {
              content: string;
              link: string | null;
            };
            annotations: Annotations;
            plain_text: string;
            href: string | null;
          },
        ];
      };
      Thumbnail: {
        id: string;
        type: 'files';
        files: {
          name: string;
          type: 'file';
          file: {
            url: string;
            expiry_time: string;
          };
        }[];
      };
      'Posted Date': {
        id: string;
        type: 'date';
        date: string | null;
      };
      Title: {
        id: string;
        type: 'title';
        title: {
          type: 'text';
          text: {
            content: string;
            link: string | null;
          };
          annotations: Annotations;
          plain_text: string;
          href: string | null;
        }[];
      };
    };
  }[];
  next_cursor: string | null;
  has_more: boolean;
  type: 'page_or_database';
  page_or_database: Record<string, never>;
  developer_survey: string;
  request_id: string;
}
