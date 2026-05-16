import swaggerUiDist from 'swagger-ui-dist';

export const swaggerUiAssetPath = swaggerUiDist.getAbsoluteFSPath();

const ref = (schemaName) => ({ $ref: `#/components/schemas/${schemaName}` });

function jsonContent(schema, example) {
  return {
    'application/json': {
      schema,
      ...(example ? { example } : {})
    }
  };
}

function jsonResponse(description, schema, example) {
  return {
    description,
    content: jsonContent(schema, example)
  };
}

function itemEnvelope(schemaName, key = 'item') {
  return {
    type: 'object',
    required: [key],
    properties: {
      [key]: ref(schemaName)
    }
  };
}

function itemsEnvelope(schemaName) {
  return {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: ref(schemaName)
      }
    }
  };
}

function pagedEnvelope(schemaName) {
  return {
    type: 'object',
    required: ['items', 'meta'],
    properties: {
      items: {
        type: 'array',
        items: ref(schemaName)
      },
      meta: ref('PageMeta')
    }
  };
}

const standardErrors = {
  400: jsonResponse('Bad request or validation error', ref('ValidationError')),
  401: jsonResponse('Authentication is required', ref('ApiError')),
  403: jsonResponse('Forbidden', ref('ApiError')),
  404: jsonResponse('Resource not found', ref('ApiError')),
  409: jsonResponse('Conflict', ref('ApiError')),
  500: jsonResponse('Internal server error', ref('ApiError'))
};

function pickErrors(codes) {
  return Object.fromEntries(codes.map((code) => [code, standardErrors[code]]));
}

function uuidPathParameter(name, description) {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: {
      type: 'string',
      format: 'uuid'
    }
  };
}

function stringPathParameter(name, description) {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: {
      type: 'string'
    }
  };
}

function pageParameter(defaultValue = 1) {
  return {
    name: 'page',
    in: 'query',
    description: '1-based page number',
    schema: {
      type: 'integer',
      minimum: 1,
      default: defaultValue
    }
  };
}

function limitParameter(defaultValue = 12) {
  return {
    name: 'limit',
    in: 'query',
    description: 'Maximum number of items per page',
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 50,
      default: defaultValue
    }
  };
}

const queryParameter = {
  name: 'query',
  in: 'query',
  description: 'Free-text query',
  schema: {
    type: 'string'
  }
};

const originParameter = {
  name: 'origin',
  in: 'query',
  description: 'Restrict search by literature origin',
  schema: {
    type: 'string',
    enum: ['foreign', 'russian']
  }
};

const authorParameter = {
  name: 'author',
  in: 'query',
  description: 'Author name filter',
  schema: {
    type: 'string'
  }
};

const sectionParameter = {
  name: 'section',
  in: 'query',
  description: 'Catalog section filter',
  schema: {
    type: 'string'
  }
};

const genresParameter = {
  name: 'genres',
  in: 'query',
  description: 'Comma-separated genre names',
  schema: {
    type: 'string',
    example: 'Fantasy,Classics'
  }
};

const tagsParameter = {
  name: 'tags',
  in: 'query',
  description: 'Comma-separated tag names',
  schema: {
    type: 'string',
    example: 'Atmospheric,Philosophical'
  }
};

const languageParameter = {
  name: 'language',
  in: 'query',
  description: 'Language code or human-readable language name',
  schema: {
    type: 'string'
  }
};

const yearFromParameter = {
  name: 'yearFrom',
  in: 'query',
  description: 'Lower bound for publication year',
  schema: {
    type: 'integer'
  }
};

const yearToParameter = {
  name: 'yearTo',
  in: 'query',
  description: 'Upper bound for publication year',
  schema: {
    type: 'integer'
  }
};

const minRatingParameter = {
  name: 'minRating',
  in: 'query',
  description: 'Minimum final score according to the 84 algorithm',
  schema: {
    type: 'number',
    minimum: 0,
    maximum: 84
  }
};

const maxRatingParameter = {
  name: 'maxRating',
  in: 'query',
  description: 'Maximum final score according to the 84 algorithm',
  schema: {
    type: 'number',
    minimum: 0,
    maximum: 84
  }
};

const bookSortParameter = {
  name: 'sort',
  in: 'query',
  description: 'Book list sorting',
  schema: {
    type: 'string',
    enum: [
      'rating_desc',
      'rating_asc',
      'year_desc',
      'year_asc',
      'newest_desc',
      'newest_asc',
      'title_asc',
      'title_desc'
    ],
    default: 'newest_desc'
  }
};

const reviewSortParameter = {
  name: 'sort',
  in: 'query',
  description: 'Review list sorting',
  schema: {
    type: 'string',
    enum: ['newest', 'oldest', 'likes_desc', 'likes_asc'],
    default: 'newest'
  }
};

const moderationStatusParameter = {
  name: 'status',
  in: 'query',
  description: 'Moderation status filter',
  schema: {
    type: 'string',
    enum: ['DRAFT', 'PUBLISHED', 'HIDDEN']
  }
};

function protectedOperation(operation) {
  return {
    ...operation,
    security: [{ bearerAuth: [] }]
  };
}

function adminOperation(operation) {
  return {
    ...protectedOperation(operation),
    description: [operation.description, 'Requires ADMIN role.'].filter(Boolean).join(' ')
  };
}

function createTaxonomyPathGroup(basePath, tagName, itemSchemaName, createSchemaName, label) {
  return {
    [basePath]: {
      get: {
        tags: [tagName],
        summary: `List ${label.toLowerCase()}`,
        parameters: [queryParameter, pageParameter(1), limitParameter(20)],
        responses: {
          200: jsonResponse(`Paged ${label.toLowerCase()} list`, pagedEnvelope(itemSchemaName)),
          ...pickErrors([400, 500])
        }
      },
      post: adminOperation({
        tags: [tagName],
        summary: `Create ${label.toLowerCase().slice(0, -1)}`,
        requestBody: {
          required: true,
          content: jsonContent(ref(createSchemaName))
        },
        responses: {
          201: jsonResponse(`${label.slice(0, -1)} created`, itemEnvelope(itemSchemaName)),
          ...pickErrors([400, 401, 403, 409, 500])
        }
      })
    },
    [`${basePath}/{id}`]: {
      get: {
        tags: [tagName],
        summary: `Get ${label.toLowerCase().slice(0, -1)}`,
        parameters: [uuidPathParameter('id', `${label.slice(0, -1)} id`)],
        responses: {
          200: jsonResponse(`${label.slice(0, -1)} details`, itemEnvelope(itemSchemaName)),
          ...pickErrors([400, 404, 500])
        }
      },
      patch: adminOperation({
        tags: [tagName],
        summary: `Update ${label.toLowerCase().slice(0, -1)}`,
        parameters: [uuidPathParameter('id', `${label.slice(0, -1)} id`)],
        requestBody: {
          required: true,
          content: jsonContent(ref(createSchemaName))
        },
        responses: {
          200: jsonResponse(`${label.slice(0, -1)} updated`, itemEnvelope(itemSchemaName)),
          ...pickErrors([400, 401, 403, 404, 409, 500])
        }
      }),
      delete: adminOperation({
        tags: [tagName],
        summary: `Delete ${label.toLowerCase().slice(0, -1)}`,
        parameters: [uuidPathParameter('id', `${label.slice(0, -1)} id`)],
        responses: {
          204: {
            description: 'Deleted successfully'
          },
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    }
  };
}

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Bookpoisk API',
    version: '1.0.0',
    description: [
      'Interactive REST API documentation for the Bookpoisk backend.',
      '',
      'Recommended manual testing flow:',
      '1. Call `POST /auth/login` with one of the demo accounts.',
      '2. Copy `accessToken` from the response.',
      '3. Click **Authorize** and paste the token as `Bearer <token>`.',
      '4. Test protected routes such as ratings, favorites, collections and AI search.',
      '5. `POST /auth/refresh` and `POST /auth/logout` use the refresh cookie created by login.',
      '',
      'AI search returns only books that exist in the local catalog and may legitimately return an empty result set.'
    ].join('\n')
  },
  servers: [
    { url: '/api', description: 'Relative API base URL' },
    { url: 'http://127.0.0.1:4000/api', description: 'Local development server' }
  ],
  tags: [
    { name: 'Health', description: 'Service liveness check' },
    { name: 'Auth', description: 'Registration, login, session refresh and current user' },
    { name: 'Users', description: 'Reader profiles, avatar upload and subscriptions' },
    { name: 'Books', description: 'Catalog browsing, book details and novelty feed' },
    { name: 'Ratings', description: 'Reader ratings based on the mandatory 84 algorithm' },
    { name: 'Search', description: 'Ordinary catalog search and AI-assisted search' },
    { name: 'Favorites', description: 'Favorite books of the current reader' },
    { name: 'Collections', description: 'Custom collections and reading shelves' },
    { name: 'Reviews', description: 'Reviews, reactions and review comments' },
    { name: 'Articles', description: 'Articles and article comments' },
    { name: 'Authors', description: 'Author taxonomy CRUD' },
    { name: 'Genres', description: 'Genre taxonomy CRUD' },
    { name: 'Tags', description: 'Tag taxonomy CRUD' },
    { name: 'Admin', description: 'Administrative dashboards and moderation queues' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token returned by `POST /auth/login`.'
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        required: ['ok'],
        properties: {
          ok: {
            type: 'boolean',
            example: true
          }
        }
      },
      ApiError: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            example: 'Forbidden'
          },
          details: {
            nullable: true
          }
        }
      },
      ValidationError: {
        type: 'object',
        required: ['message', 'details'],
        properties: {
          message: {
            type: 'string',
            example: 'Validation error'
          },
          details: {
            type: 'object',
            additionalProperties: true
          }
        }
      },
      PageMeta: {
        type: 'object',
        required: ['total', 'page', 'limit', 'totalPages'],
        properties: {
          total: { type: 'integer', example: 2119 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 12 },
          totalPages: { type: 'integer', example: 177 }
        }
      },
      UserSettings: {
        type: 'object',
        properties: {
          showRatings: { type: 'boolean', example: true },
          showReviews: { type: 'boolean', example: true },
          showFavorites: { type: 'boolean', example: true },
          showLibrary: { type: 'boolean', example: true }
        }
      },
      User: {
        type: 'object',
        required: ['id', 'username', 'email', 'role', 'isActive', 'settings'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string', example: 'reader' },
          email: { type: 'string', format: 'email', example: 'reader@bookpoisk.local' },
          fullName: { type: 'string', nullable: true, example: 'Ivan Petrov' },
          birthDate: { type: 'string', nullable: true, example: '2002-03-14' },
          city: { type: 'string', nullable: true, example: 'Moscow' },
          favoriteGenres: {
            type: 'array',
            nullable: true,
            items: { type: 'string' },
            example: ['Fantasy', 'Classics']
          },
          avatarUrl: { type: 'string', nullable: true, example: '/uploads/avatars/demo.png' },
          bio: { type: 'string', nullable: true, example: 'Reader and review author.' },
          role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
          isActive: { type: 'boolean', example: true },
          settings: ref('UserSettings')
        }
      },
      PublicUserProfile: {
        allOf: [
          ref('User'),
          {
            type: 'object',
            properties: {
              followersCount: { type: 'integer', example: 12 },
              followingCount: { type: 'integer', example: 7 },
              isFollowing: { type: 'boolean', example: false },
              featuredBooks: {
                type: 'array',
                items: ref('ProfileBook')
              },
              favoriteBooks: {
                type: 'array',
                items: ref('ProfileBook')
              },
              ratedBooks: {
                type: 'array',
                items: ref('ProfileBook')
              }
            }
          }
        ]
      },
      RegisterRequest: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', example: 'reader' },
          email: { type: 'string', format: 'email', example: 'reader@bookpoisk.local' },
          fullName: { type: 'string', example: 'Ivan Petrov' },
          birthDate: { type: 'string', example: '2002-03-14' },
          city: { type: 'string', example: 'Moscow' },
          favoriteGenres: {
            type: 'array',
            items: { type: 'string' },
            example: ['Fantasy', 'Classics']
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            example: 'Reader123!'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'reader@bookpoisk.local' },
          password: { type: 'string', format: 'password', example: 'Reader123!' }
        }
      },
      AuthSessionResponse: {
        type: 'object',
        required: ['accessToken', 'user'],
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          user: ref('User')
        }
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          username: { type: 'string', example: 'reader-new' },
          email: { type: 'string', format: 'email', example: 'reader2@bookpoisk.local' },
          fullName: { type: 'string', nullable: true, example: 'Ivan Petrov' },
          birthDate: { type: 'string', nullable: true, example: '2002-03-14' },
          city: { type: 'string', nullable: true, example: 'Yaroslavl' },
          favoriteGenres: {
            type: 'array',
            nullable: true,
            items: { type: 'string' },
            example: ['Fantasy', 'Mystery']
          },
          avatarUrl: { type: 'string', nullable: true, example: '/uploads/avatars/demo.png' },
          bio: { type: 'string', nullable: true, example: 'Reading every evening.' },
          featuredBookIds: {
            type: 'array',
            maxItems: 5,
            items: {
              type: 'string',
              format: 'uuid'
            }
          },
          showRatings: { type: 'boolean' },
          showReviews: { type: 'boolean' },
          showFavorites: { type: 'boolean' },
          showLibrary: { type: 'boolean' }
        }
      },
      Author: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'Ray Bradbury' },
          birthDate: { type: 'string', nullable: true, example: '1920-08-22' },
          deathDate: { type: 'string', nullable: true, example: '2012-06-05' },
          bio: { type: 'string', nullable: true, example: 'American author and screenwriter.' },
          bookCount: { type: 'integer', example: 8 }
        }
      },
      Genre: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Fantasy' },
          description: { type: 'string', nullable: true, example: 'Fantasy literature.' },
          bookCount: { type: 'integer', example: 123 }
        }
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Atmospheric' },
          bookCount: { type: 'integer', example: 40 }
        }
      },
      CreateAuthorRequest: {
        type: 'object',
        required: ['fullName'],
        properties: {
          fullName: { type: 'string', example: 'Ray Bradbury' },
          birthDate: { type: 'string', example: '1920-08-22' },
          deathDate: { type: 'string', example: '2012-06-05' },
          bio: { type: 'string', example: 'American author and screenwriter.' }
        }
      },
      CreateGenreRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Fantasy' },
          description: { type: 'string', example: 'Fantasy literature.' }
        }
      },
      CreateTagRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Atmospheric' }
        }
      },
      BookAuthor: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'George Orwell' },
          role: { type: 'string', nullable: true, example: 'author' },
          authorOrder: { type: 'integer', example: 1 }
        }
      },
      BookPreview: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: '1984' },
          coverUrl: { type: 'string', nullable: true, example: 'https://example.com/1984.jpg' }
        }
      },
      ProfileBook: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: '1984' },
          description: { type: 'string', nullable: true, example: 'Dystopian classic.' },
          coverUrl: { type: 'string', nullable: true, example: 'https://example.com/1984.jpg' },
          authors: {
            type: 'array',
            items: ref('BookAuthor')
          }
        }
      },
      Book: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: '1984' },
          originalTitle: { type: 'string', nullable: true, example: 'Nineteen Eighty-Four' },
          description: { type: 'string', nullable: true, example: 'A dystopian political novel.' },
          isbn13: { type: 'string', nullable: true, example: '9780451524935' },
          catalogSection: { type: 'string', nullable: true, example: 'Fiction' },
          catalogSectionSlug: { type: 'string', nullable: true, example: 'fiction' },
          publicationYear: { type: 'integer', nullable: true, example: 1949 },
          language: { type: 'string', nullable: true, example: 'en' },
          coverUrl: { type: 'string', nullable: true, example: 'https://example.com/1984.jpg' },
          sourceSite: { type: 'string', nullable: true, example: 'eksmo' },
          sourceUrl: { type: 'string', nullable: true, example: 'https://www.eksmo.ru/book/...' },
          series: { type: 'string', nullable: true },
          publisher: { type: 'string', nullable: true },
          editor: { type: 'string', nullable: true },
          ageRestriction: { type: 'string', nullable: true, example: '16+' },
          binding: { type: 'string', nullable: true },
          pageCount: { type: 'integer', nullable: true, example: 352 },
          weightGrams: { type: 'integer', nullable: true },
          thicknessMm: { type: 'integer', nullable: true },
          bookFormat: { type: 'string', nullable: true },
          paperMaterial: { type: 'string', nullable: true },
          readTimeHours: { type: 'number', nullable: true, example: 8.5 },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'], example: 'PUBLISHED' },
          authors: {
            type: 'array',
            items: ref('BookAuthor')
          },
          genres: {
            type: 'array',
            items: ref('Genre')
          },
          tags: {
            type: 'array',
            items: ref('Tag')
          },
          avgFinalScore: { type: 'number', example: 76.2 },
          avgArchitecture: { type: 'number', example: 8.2 },
          avgCharacters: { type: 'number', example: 8.8 },
          avgLanguage: { type: 'number', example: 8.5 },
          avgIdea: { type: 'number', example: 9.4 },
          avgVibe: { type: 'number', example: 8.1 },
          ratingCount: { type: 'integer', example: 37 },
          ratingLabel: { type: 'string', nullable: true, example: 'Strong and memorable book' },
          aiReason: { type: 'string', nullable: true, example: 'Matches the requested atmosphere and theme.' },
          aiMatchType: { type: 'string', nullable: true, example: 'exact' }
        }
      },
      BookCreateRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: '1984' },
          originalTitle: { type: 'string', example: 'Nineteen Eighty-Four' },
          description: { type: 'string', example: 'A dystopian political novel.' },
          publicationYear: { type: 'integer', example: 1949 },
          language: { type: 'string', example: 'en' },
          coverUrl: { type: 'string', format: 'uri', example: 'https://example.com/1984.jpg' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'], example: 'PUBLISHED' },
          authorIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' }
          },
          genreIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' }
          },
          tagIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' }
          }
        }
      },
      BookStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'],
            example: 'HIDDEN'
          }
        }
      },
      BookFragment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          available: { type: 'boolean', example: true },
          source: { type: 'string', nullable: true, example: 'eksmo' },
          pdfUrl: { type: 'string', nullable: true, example: '/api/books/uuid/fragment/file' },
          contentType: { type: 'string', nullable: true, example: 'application/pdf' },
          contentLength: { type: 'integer', nullable: true, example: 1280442 }
        },
        additionalProperties: true
      },
      NoveltyFeedItem: {
        type: 'object',
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: '1984' },
          subtitle: { type: 'string', nullable: true },
          author: { type: 'string', nullable: true, example: 'George Orwell' },
          coverUrl: { type: 'string', nullable: true },
          avgFinalScore: { type: 'number', example: 76.2 },
          ratingCount: { type: 'integer', example: 37 },
          ratingLabel: { type: 'string', nullable: true }
        },
        additionalProperties: true
      },
      RatingInput: {
        type: 'object',
        required: ['architecture', 'characters', 'language', 'idea', 'vibe'],
        properties: {
          architecture: { type: 'integer', minimum: 1, maximum: 10, example: 8 },
          characters: { type: 'integer', minimum: 1, maximum: 10, example: 9 },
          language: { type: 'integer', minimum: 1, maximum: 10, example: 8 },
          idea: { type: 'integer', minimum: 1, maximum: 10, example: 10 },
          vibe: { type: 'integer', minimum: 1, maximum: 10, example: 9 },
          reviewBody: {
            type: 'string',
            description: 'Optional inline review body. Minimum 150 characters.',
            example: 'Detailed reader impression with arguments and examples from the text...'
          }
        }
      },
      RatingBreakdown: {
        type: 'object',
        properties: {
          objectiveScore: { type: 'number', example: 49 },
          multiplier: { type: 'number', example: 1.4444 },
          finalScore: { type: 'integer', example: 71 }
        }
      },
      RatingRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          bookId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          architecture: { type: 'integer', example: 8 },
          characters: { type: 'integer', example: 9 },
          language: { type: 'integer', example: 8 },
          idea: { type: 'integer', example: 10 },
          vibe: { type: 'integer', example: 9 },
          finalScore: { type: 'integer', example: 71 }
        }
      },
      RatingResponse: {
        type: 'object',
        properties: {
          rating: ref('RatingRecord'),
          review: {
            nullable: true,
            allOf: [ref('Review')]
          },
          breakdown: ref('RatingBreakdown')
        }
      },
      FavoriteItem: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          bookId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          book: ref('Book')
        }
      },
      FavoriteStatus: {
        type: 'object',
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          isFavorite: { type: 'boolean', example: true }
        }
      },
      CollectionInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Books for summer' },
          description: { type: 'string', example: 'Light and warm books for July.' },
          isPublic: { type: 'boolean', example: true }
        }
      },
      CollectionBookInput: {
        type: 'object',
        required: ['bookId'],
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          note: { type: 'string', example: 'Read after the article on dystopias.' }
        }
      },
      CollectionBookUpdate: {
        type: 'object',
        properties: {
          note: { type: 'string', example: 'Move this closer to the top of the list.' }
        }
      },
      CollectionBook: {
        type: 'object',
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          note: { type: 'string', nullable: true },
          addedAt: { type: 'string', format: 'date-time' },
          book: ref('Book')
        },
        additionalProperties: true
      },
      Collection: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Books for summer' },
          description: { type: 'string', nullable: true, example: 'Light and warm books for July.' },
          isPublic: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string', example: 'reader' }
            }
          },
          collectionBooks: {
            type: 'array',
            items: ref('CollectionBook')
          }
        },
        additionalProperties: true
      },
      ReadingShelfState: {
        type: 'object',
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          shelfKey: {
            type: 'string',
            nullable: true,
            enum: ['want-to-read', 'read', 'stopped-reading'],
            example: 'want-to-read'
          }
        }
      },
      ReadingShelf: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          key: { type: 'string', example: 'want-to-read' },
          title: { type: 'string', example: 'Want to read' },
          description: { type: 'string', nullable: true },
          isPublic: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          bookCount: { type: 'integer', example: 12 },
          books: {
            type: 'array',
            items: ref('Book')
          }
        }
      },
      ReviewInput: {
        type: 'object',
        required: ['bookId', 'title', 'body'],
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'A bleak but necessary classic' },
          body: { type: 'string', example: 'A detailed review body with at least 20 characters.' },
          isSpoiler: { type: 'boolean', example: false },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'], example: 'PUBLISHED' }
        }
      },
      ReviewCommentInput: {
        type: 'object',
        properties: {
          body: { type: 'string', example: 'I strongly agree with this point.' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'], example: 'PUBLISHED' }
        }
      },
      ReviewReactionInput: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['LIKE', 'DISLIKE'],
            example: 'LIKE'
          }
        }
      },
      ContentComment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          body: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: ref('User')
        },
        additionalProperties: true
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'A bleak but necessary classic' },
          body: { type: 'string' },
          isSpoiler: { type: 'boolean', example: false },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          likesCount: { type: 'integer', example: 3 },
          dislikesCount: { type: 'integer', example: 0 },
          myReaction: { type: 'string', nullable: true, enum: ['LIKE', 'DISLIKE'] },
          user: ref('User'),
          book: ref('BookPreview'),
          comments: {
            type: 'array',
            items: ref('ContentComment')
          }
        },
        additionalProperties: true
      },
      ArticleInput: {
        type: 'object',
        required: ['title', 'body'],
        properties: {
          bookId: { type: 'string', format: 'uuid', nullable: true },
          title: { type: 'string', example: 'How dystopias shape reader expectations' },
          body: { type: 'string', example: 'A detailed article body with at least 50 characters.' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'], example: 'PUBLISHED' }
        }
      },
      ArticleCommentInput: {
        type: 'object',
        properties: {
          body: { type: 'string', example: 'Useful article, thank you.' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'], example: 'PUBLISHED' }
        }
      },
      Article: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'How dystopias shape reader expectations' },
          body: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: ref('User'),
          book: {
            nullable: true,
            allOf: [ref('BookPreview')]
          },
          comments: {
            type: 'array',
            items: ref('ContentComment')
          }
        },
        additionalProperties: true
      },
      SearchFilters: {
        type: 'object',
        properties: {
          query: { type: 'string', nullable: true, example: 'foreign classics' },
          author: { type: 'string', nullable: true, example: 'George Orwell' },
          section: { type: 'string', nullable: true, example: 'Fiction' },
          origin: { type: 'string', nullable: true, enum: ['foreign', 'russian'] },
          genres: {
            type: 'array',
            items: { type: 'string' },
            example: ['Classics']
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['Atmospheric']
          },
          language: { type: 'string', nullable: true, example: 'en' },
          yearFrom: { type: 'integer', nullable: true, example: 1900 },
          yearTo: { type: 'integer', nullable: true, example: 2000 },
          sort: {
            type: 'string',
            enum: [
              'rating_desc',
              'rating_asc',
              'year_desc',
              'year_asc',
              'newest_desc',
              'newest_asc',
              'title_asc',
              'title_desc'
            ],
            example: 'newest_desc'
          },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 8 }
        }
      },
      AiSearchRequest: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            example: 'I want an atmospheric foreign classic with a strong idea.'
          },
          filters: ref('SearchFilters')
        }
      },
      AiAssistant: {
        type: 'object',
        properties: {
          source: { type: 'string', example: 'fallback' },
          answer: {
            type: 'string',
            example: 'Closest matches are "1984" and "Fahrenheit 451".'
          },
          recommendedBookIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' }
          }
        }
      },
      AiWarning: {
        type: 'object',
        properties: {
          code: { type: 'string', nullable: true, example: 'AI_PROVIDER_UNAVAILABLE' },
          message: { type: 'string', example: 'AI response is temporarily unavailable. Showing local catalog matches.' }
        },
        additionalProperties: true
      },
      AiSearchResponse: {
        type: 'object',
        properties: {
          interpreted: {
            type: 'object',
            properties: {
              source: { type: 'string', example: 'ai' },
              filters: ref('SearchFilters')
            }
          },
          assistant: ref('AiAssistant'),
          warning: {
            nullable: true,
            allOf: [ref('AiWarning')]
          },
          results: pagedEnvelope('Book')
        }
      },
      ModerationStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'],
            example: 'PUBLISHED'
          }
        }
      },
      AdminDashboard: {
        type: 'object',
        properties: {
          stats: {
            type: 'object',
            properties: {
              users: { type: 'integer', example: 25 },
              books: { type: 'integer', example: 2119 },
              reviews: { type: 'integer', example: 18 },
              articles: { type: 'integer', example: 6 },
              comments: { type: 'integer', example: 44 },
              collections: { type: 'integer', example: 19 }
            }
          }
        }
      },
      OkResponse: {
        type: 'object',
        properties: {
          ok: {
            type: 'boolean',
            example: true
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: jsonResponse('Server is healthy', ref('HealthResponse'))
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: jsonContent(ref('RegisterRequest'))
        },
        responses: {
          201: jsonResponse('User registered', itemEnvelope('User', 'user')),
          ...pickErrors([400, 409, 500])
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive access token',
        description: 'Also sets the refresh token cookie for `/auth/refresh` and `/auth/logout`.',
        requestBody: {
          required: true,
          content: jsonContent(ref('LoginRequest'))
        },
        responses: {
          200: jsonResponse('Login successful', ref('AuthSessionResponse')),
          ...pickErrors([400, 401, 403, 500])
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Uses the refresh token cookie set by the login route.',
        responses: {
          200: jsonResponse('Token refreshed', ref('AuthSessionResponse')),
          ...pickErrors([401, 500])
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current session',
        description: 'Revokes the refresh token identified by the refresh cookie.',
        responses: {
          200: jsonResponse('Logged out', ref('OkResponse')),
          ...pickErrors([500])
        }
      }
    },
    '/auth/me': {
      get: protectedOperation({
        tags: ['Auth'],
        summary: 'Get current user',
        responses: {
          200: jsonResponse('Current user profile', itemEnvelope('User', 'user')),
          ...pickErrors([401, 404, 500])
        }
      })
    },
    '/users/discover': {
      get: protectedOperation({
        tags: ['Users'],
        summary: 'Discover users',
        parameters: [
          {
            name: 'query',
            in: 'query',
            description: 'Search by username or name',
            schema: {
              type: 'string',
              maxLength: 50,
              default: ''
            }
          }
        ],
        responses: {
          200: jsonResponse('User discovery results', itemsEnvelope('User')),
          ...pickErrors([400, 401, 500])
        }
      })
    },
    '/users/me': {
      get: protectedOperation({
        tags: ['Users'],
        summary: 'Get own profile',
        responses: {
          200: jsonResponse('Own profile', itemEnvelope('PublicUserProfile', 'user')),
          ...pickErrors([401, 404, 500])
        }
      }),
      patch: protectedOperation({
        tags: ['Users'],
        summary: 'Update own profile',
        requestBody: {
          required: true,
          content: jsonContent(ref('UpdateProfileRequest'))
        },
        responses: {
          200: jsonResponse('Profile updated', itemEnvelope('PublicUserProfile', 'user')),
          ...pickErrors([400, 401, 404, 409, 500])
        }
      })
    },
    '/users/me/avatar': {
      post: protectedOperation({
        tags: ['Users'],
        summary: 'Upload avatar',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: jsonResponse('Avatar updated', itemEnvelope('PublicUserProfile', 'user')),
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    '/users/{username}': {
      get: {
        tags: ['Users'],
        summary: 'Get public profile by username',
        parameters: [stringPathParameter('username', 'Public username')],
        responses: {
          200: jsonResponse('Public profile', itemEnvelope('PublicUserProfile', 'user')),
          ...pickErrors([400, 404, 500])
        }
      }
    },
    '/users/{username}/follow': {
      post: protectedOperation({
        tags: ['Users'],
        summary: 'Follow a user',
        parameters: [stringPathParameter('username', 'Public username')],
        responses: {
          200: jsonResponse('Updated public profile', itemEnvelope('PublicUserProfile', 'user')),
          ...pickErrors([400, 401, 404, 409, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Users'],
        summary: 'Unfollow a user',
        parameters: [stringPathParameter('username', 'Public username')],
        responses: {
          200: jsonResponse('Updated public profile', itemEnvelope('PublicUserProfile', 'user')),
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    ...createTaxonomyPathGroup('/authors', 'Authors', 'Author', 'CreateAuthorRequest', 'Authors'),
    ...createTaxonomyPathGroup('/genres', 'Genres', 'Genre', 'CreateGenreRequest', 'Genres'),
    ...createTaxonomyPathGroup('/tags', 'Tags', 'Tag', 'CreateTagRequest', 'Tags'),
    '/books': {
      get: {
        tags: ['Books'],
        summary: 'List books',
        parameters: [
          queryParameter,
          authorParameter,
          sectionParameter,
          genresParameter,
          tagsParameter,
          languageParameter,
          yearFromParameter,
          yearToParameter,
          minRatingParameter,
          maxRatingParameter,
          bookSortParameter,
          pageParameter(1),
          limitParameter(12)
        ],
        responses: {
          200: jsonResponse('Paged book list', pagedEnvelope('Book')),
          ...pickErrors([400, 500])
        }
      },
      post: adminOperation({
        tags: ['Books'],
        summary: 'Create a book',
        requestBody: {
          required: true,
          content: jsonContent(ref('BookCreateRequest'))
        },
        responses: {
          201: jsonResponse('Book created', itemEnvelope('Book')),
          ...pickErrors([400, 401, 403, 409, 500])
        }
      })
    },
    '/books/novelty-feed': {
      get: {
        tags: ['Books'],
        summary: 'Get novelty feed',
        description: 'Returns the curated novelty carousel shown on the main page.',
        responses: {
          200: jsonResponse(
            'Novelty feed items',
            {
              type: 'object',
              required: ['items'],
              properties: {
                items: {
                  type: 'array',
                  items: ref('NoveltyFeedItem')
                }
              }
            }
          ),
          ...pickErrors([500])
        }
      }
    },
    '/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Get book details',
        parameters: [uuidPathParameter('id', 'Book id')],
        responses: {
          200: jsonResponse('Book details', itemEnvelope('Book')),
          ...pickErrors([400, 404, 500])
        }
      },
      patch: adminOperation({
        tags: ['Books'],
        summary: 'Update a book',
        parameters: [uuidPathParameter('id', 'Book id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('BookCreateRequest'))
        },
        responses: {
          200: jsonResponse('Book updated', itemEnvelope('Book')),
          ...pickErrors([400, 401, 403, 404, 409, 500])
        }
      }),
      delete: adminOperation({
        tags: ['Books'],
        summary: 'Delete a book',
        parameters: [uuidPathParameter('id', 'Book id')],
        responses: {
          204: {
            description: 'Book deleted'
          },
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/books/{id}/fragment': {
      get: {
        tags: ['Books'],
        summary: 'Get book fragment metadata',
        parameters: [uuidPathParameter('id', 'Book id')],
        responses: {
          200: jsonResponse('Fragment metadata', itemEnvelope('BookFragment')),
          ...pickErrors([400, 404, 500])
        }
      }
    },
    '/books/{id}/fragment/file': {
      get: {
        tags: ['Books'],
        summary: 'Stream fragment file',
        parameters: [uuidPathParameter('id', 'Book id')],
        responses: {
          200: {
            description: 'Fragment file stream',
            content: {
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          },
          ...pickErrors([400, 404, 500])
        }
      }
    },
    '/books/{id}/status': {
      patch: adminOperation({
        tags: ['Books'],
        summary: 'Update book status',
        parameters: [uuidPathParameter('id', 'Book id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('BookStatusRequest'))
        },
        responses: {
          200: jsonResponse('Book status updated', itemEnvelope('Book')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/ratings/me': {
      get: protectedOperation({
        tags: ['Ratings'],
        summary: 'List my ratings',
        responses: {
          200: jsonResponse('Own ratings', itemsEnvelope('RatingRecord')),
          ...pickErrors([401, 500])
        }
      })
    },
    '/ratings/books/{bookId}/rating': {
      put: protectedOperation({
        tags: ['Ratings'],
        summary: 'Create or update rating',
        description: 'Uses the mandatory 84-point algorithm based on five 1..10 criteria.',
        parameters: [uuidPathParameter('bookId', 'Book id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('RatingInput'))
        },
        responses: {
          200: jsonResponse('Rating stored', ref('RatingResponse')),
          ...pickErrors([400, 401, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Ratings'],
        summary: 'Delete own rating',
        parameters: [uuidPathParameter('bookId', 'Book id')],
        responses: {
          204: {
            description: 'Rating deleted'
          },
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    '/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews',
        parameters: [
          {
            name: 'bookId',
            in: 'query',
            description: 'Optional book filter',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          },
          reviewSortParameter,
          pageParameter(1),
          limitParameter(10)
        ],
        responses: {
          200: jsonResponse('Paged review list', pagedEnvelope('Review')),
          ...pickErrors([400, 500])
        }
      },
      post: protectedOperation({
        tags: ['Reviews'],
        summary: 'Create review',
        requestBody: {
          required: true,
          content: jsonContent(ref('ReviewInput'))
        },
        responses: {
          201: jsonResponse('Review created', itemEnvelope('Review')),
          ...pickErrors([400, 401, 404, 409, 500])
        }
      })
    },
    '/reviews/{id}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get review',
        parameters: [uuidPathParameter('id', 'Review id')],
        responses: {
          200: jsonResponse('Review details', itemEnvelope('Review')),
          ...pickErrors([400, 404, 500])
        }
      },
      patch: protectedOperation({
        tags: ['Reviews'],
        summary: 'Update review',
        parameters: [uuidPathParameter('id', 'Review id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ReviewInput'))
        },
        responses: {
          200: jsonResponse('Review updated', itemEnvelope('Review')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Reviews'],
        summary: 'Delete review',
        parameters: [uuidPathParameter('id', 'Review id')],
        responses: {
          204: {
            description: 'Review deleted'
          },
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/reviews/{id}/reaction': {
      put: protectedOperation({
        tags: ['Reviews'],
        summary: 'React to review',
        parameters: [uuidPathParameter('id', 'Review id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ReviewReactionInput'))
        },
        responses: {
          200: jsonResponse('Reaction stored', itemEnvelope('Review')),
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    '/reviews/{reviewId}/comments': {
      post: protectedOperation({
        tags: ['Reviews'],
        summary: 'Create review comment',
        parameters: [uuidPathParameter('reviewId', 'Review id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ReviewCommentInput'))
        },
        responses: {
          201: jsonResponse('Comment created', itemEnvelope('ContentComment')),
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    '/reviews/{reviewId}/comments/{commentId}': {
      patch: protectedOperation({
        tags: ['Reviews'],
        summary: 'Update review comment',
        parameters: [
          uuidPathParameter('reviewId', 'Review id'),
          uuidPathParameter('commentId', 'Comment id')
        ],
        requestBody: {
          required: true,
          content: jsonContent(ref('ReviewCommentInput'))
        },
        responses: {
          200: jsonResponse('Comment updated', itemEnvelope('ContentComment')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Reviews'],
        summary: 'Delete review comment',
        parameters: [
          uuidPathParameter('reviewId', 'Review id'),
          uuidPathParameter('commentId', 'Comment id')
        ],
        responses: {
          204: {
            description: 'Comment deleted'
          },
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/articles': {
      get: {
        tags: ['Articles'],
        summary: 'List articles',
        parameters: [
          {
            name: 'bookId',
            in: 'query',
            description: 'Optional book filter',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          },
          pageParameter(1),
          limitParameter(10)
        ],
        responses: {
          200: jsonResponse('Paged article list', pagedEnvelope('Article')),
          ...pickErrors([400, 500])
        }
      },
      post: protectedOperation({
        tags: ['Articles'],
        summary: 'Create article',
        requestBody: {
          required: true,
          content: jsonContent(ref('ArticleInput'))
        },
        responses: {
          201: jsonResponse('Article created', itemEnvelope('Article')),
          ...pickErrors([400, 401, 404, 409, 500])
        }
      })
    },
    '/articles/{id}': {
      get: {
        tags: ['Articles'],
        summary: 'Get article',
        parameters: [uuidPathParameter('id', 'Article id')],
        responses: {
          200: jsonResponse('Article details', itemEnvelope('Article')),
          ...pickErrors([400, 404, 500])
        }
      },
      patch: protectedOperation({
        tags: ['Articles'],
        summary: 'Update article',
        parameters: [uuidPathParameter('id', 'Article id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ArticleInput'))
        },
        responses: {
          200: jsonResponse('Article updated', itemEnvelope('Article')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Articles'],
        summary: 'Delete article',
        parameters: [uuidPathParameter('id', 'Article id')],
        responses: {
          204: {
            description: 'Article deleted'
          },
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/articles/{articleId}/comments': {
      post: protectedOperation({
        tags: ['Articles'],
        summary: 'Create article comment',
        parameters: [uuidPathParameter('articleId', 'Article id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ArticleCommentInput'))
        },
        responses: {
          201: jsonResponse('Comment created', itemEnvelope('ContentComment')),
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    '/articles/{articleId}/comments/{commentId}': {
      patch: protectedOperation({
        tags: ['Articles'],
        summary: 'Update article comment',
        parameters: [
          uuidPathParameter('articleId', 'Article id'),
          uuidPathParameter('commentId', 'Comment id')
        ],
        requestBody: {
          required: true,
          content: jsonContent(ref('ArticleCommentInput'))
        },
        responses: {
          200: jsonResponse('Comment updated', itemEnvelope('ContentComment')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Articles'],
        summary: 'Delete article comment',
        parameters: [
          uuidPathParameter('articleId', 'Article id'),
          uuidPathParameter('commentId', 'Comment id')
        ],
        responses: {
          204: {
            description: 'Comment deleted'
          },
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/favorites': {
      get: protectedOperation({
        tags: ['Favorites'],
        summary: 'List favorite books',
        responses: {
          200: jsonResponse('Favorite book entries', itemsEnvelope('FavoriteItem')),
          ...pickErrors([401, 500])
        }
      })
    },
    '/favorites/{bookId}': {
      get: protectedOperation({
        tags: ['Favorites'],
        summary: 'Check favorite status',
        parameters: [uuidPathParameter('bookId', 'Book id')],
        responses: {
          200: jsonResponse('Favorite status', itemEnvelope('FavoriteStatus')),
          ...pickErrors([400, 401, 404, 500])
        }
      }),
      post: protectedOperation({
        tags: ['Favorites'],
        summary: 'Add favorite book',
        parameters: [uuidPathParameter('bookId', 'Book id')],
        responses: {
          201: jsonResponse('Favorite created', itemEnvelope('FavoriteItem')),
          ...pickErrors([400, 401, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Favorites'],
        summary: 'Remove favorite book',
        parameters: [uuidPathParameter('bookId', 'Book id')],
        responses: {
          204: {
            description: 'Favorite removed'
          },
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    '/collections/public': {
      get: {
        tags: ['Collections'],
        summary: 'List public collections',
        parameters: [pageParameter(1), limitParameter(12)],
        responses: {
          200: jsonResponse('Paged public collections', pagedEnvelope('Collection')),
          ...pickErrors([400, 500])
        }
      }
    },
    '/collections/mine': {
      get: protectedOperation({
        tags: ['Collections'],
        summary: 'List my collections',
        parameters: [pageParameter(1), limitParameter(12)],
        responses: {
          200: jsonResponse('Paged own collections', pagedEnvelope('Collection')),
          ...pickErrors([400, 401, 500])
        }
      })
    },
    '/collections/shelves/mine': {
      get: protectedOperation({
        tags: ['Collections'],
        summary: 'List my reading shelves',
        responses: {
          200: jsonResponse('Reading shelves', itemsEnvelope('ReadingShelf')),
          ...pickErrors([401, 500])
        }
      })
    },
    '/collections/shelves/books/{bookId}': {
      get: protectedOperation({
        tags: ['Collections'],
        summary: 'Get reading shelf state for a book',
        parameters: [uuidPathParameter('bookId', 'Book id')],
        responses: {
          200: jsonResponse('Shelf state', itemEnvelope('ReadingShelfState')),
          ...pickErrors([400, 401, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Collections'],
        summary: 'Clear reading shelf assignment',
        parameters: [uuidPathParameter('bookId', 'Book id')],
        responses: {
          200: jsonResponse('Shelf state cleared', itemEnvelope('ReadingShelfState')),
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    '/collections/shelves/{shelfKey}/books/{bookId}': {
      put: protectedOperation({
        tags: ['Collections'],
        summary: 'Assign book to reading shelf',
        parameters: [
          {
            name: 'shelfKey',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['want-to-read', 'read', 'stopped-reading']
            }
          },
          uuidPathParameter('bookId', 'Book id')
        ],
        responses: {
          200: jsonResponse('Shelf state updated', itemEnvelope('ReadingShelfState')),
          ...pickErrors([400, 401, 404, 500])
        }
      })
    },
    '/collections': {
      post: protectedOperation({
        tags: ['Collections'],
        summary: 'Create collection',
        requestBody: {
          required: true,
          content: jsonContent(ref('CollectionInput'))
        },
        responses: {
          201: jsonResponse('Collection created', itemEnvelope('Collection')),
          ...pickErrors([400, 401, 409, 500])
        }
      })
    },
    '/collections/{id}': {
      get: {
        tags: ['Collections'],
        summary: 'Get collection',
        parameters: [uuidPathParameter('id', 'Collection id')],
        responses: {
          200: jsonResponse('Collection details', itemEnvelope('Collection')),
          ...pickErrors([400, 404, 500])
        }
      },
      patch: protectedOperation({
        tags: ['Collections'],
        summary: 'Update collection',
        parameters: [uuidPathParameter('id', 'Collection id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('CollectionInput'))
        },
        responses: {
          200: jsonResponse('Collection updated', itemEnvelope('Collection')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Collections'],
        summary: 'Delete collection',
        parameters: [uuidPathParameter('id', 'Collection id')],
        responses: {
          204: {
            description: 'Collection deleted'
          },
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/collections/{id}/books': {
      post: protectedOperation({
        tags: ['Collections'],
        summary: 'Add book to collection',
        parameters: [uuidPathParameter('id', 'Collection id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('CollectionBookInput'))
        },
        responses: {
          200: jsonResponse('Collection book entry', itemEnvelope('CollectionBook')),
          ...pickErrors([400, 401, 403, 404, 409, 500])
        }
      })
    },
    '/collections/{id}/books/{bookId}': {
      patch: protectedOperation({
        tags: ['Collections'],
        summary: 'Update collection book note',
        parameters: [
          uuidPathParameter('id', 'Collection id'),
          uuidPathParameter('bookId', 'Book id')
        ],
        requestBody: {
          required: true,
          content: jsonContent(ref('CollectionBookUpdate'))
        },
        responses: {
          200: jsonResponse('Collection book updated', itemEnvelope('CollectionBook')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      }),
      delete: protectedOperation({
        tags: ['Collections'],
        summary: 'Remove book from collection',
        parameters: [
          uuidPathParameter('id', 'Collection id'),
          uuidPathParameter('bookId', 'Book id')
        ],
        responses: {
          204: {
            description: 'Book removed from collection'
          },
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Ordinary catalog search',
        parameters: [
          queryParameter,
          authorParameter,
          sectionParameter,
          originParameter,
          genresParameter,
          tagsParameter,
          languageParameter,
          yearFromParameter,
          yearToParameter,
          minRatingParameter,
          maxRatingParameter,
          bookSortParameter,
          pageParameter(1),
          limitParameter(8)
        ],
        responses: {
          200: jsonResponse('Search results', pagedEnvelope('Book')),
          ...pickErrors([400, 500])
        }
      }
    },
    '/search/ai': {
      post: protectedOperation({
        tags: ['Search'],
        summary: 'AI-assisted search',
        description:
          'Interprets a natural-language request, matches suggestions only against the local catalog and may return zero books if nothing matches. Rating is not used as a recommendation criterion.',
        requestBody: {
          required: true,
          content: jsonContent(ref('AiSearchRequest'))
        },
        responses: {
          200: jsonResponse('AI-assisted search response', ref('AiSearchResponse')),
          ...pickErrors([400, 401, 500])
        }
      })
    },
    '/admin/dashboard': {
      get: adminOperation({
        tags: ['Admin'],
        summary: 'Admin dashboard',
        responses: {
          200: jsonResponse('Dashboard statistics', ref('AdminDashboard')),
          ...pickErrors([401, 403, 500])
        }
      })
    },
    '/admin/users': {
      get: adminOperation({
        tags: ['Admin'],
        summary: 'List users for admin',
        parameters: [queryParameter, pageParameter(1), limitParameter(20)],
        responses: {
          200: jsonResponse('Paged user list', pagedEnvelope('User')),
          ...pickErrors([400, 401, 403, 500])
        }
      })
    },
    '/admin/books': {
      get: adminOperation({
        tags: ['Admin'],
        summary: 'List books for admin',
        parameters: [queryParameter, pageParameter(1), limitParameter(20)],
        responses: {
          200: jsonResponse('Paged admin book list', pagedEnvelope('Book')),
          ...pickErrors([400, 401, 403, 500])
        }
      })
    },
    '/admin/moderation/reviews': {
      get: adminOperation({
        tags: ['Admin'],
        summary: 'Review moderation queue',
        parameters: [moderationStatusParameter, pageParameter(1), limitParameter(20)],
        responses: {
          200: jsonResponse('Paged reviews for moderation', pagedEnvelope('Review')),
          ...pickErrors([400, 401, 403, 500])
        }
      })
    },
    '/admin/moderation/articles': {
      get: adminOperation({
        tags: ['Admin'],
        summary: 'Article moderation queue',
        parameters: [moderationStatusParameter, pageParameter(1), limitParameter(20)],
        responses: {
          200: jsonResponse('Paged articles for moderation', pagedEnvelope('Article')),
          ...pickErrors([400, 401, 403, 500])
        }
      })
    },
    '/admin/moderation/review-comments': {
      get: adminOperation({
        tags: ['Admin'],
        summary: 'Review comment moderation queue',
        parameters: [moderationStatusParameter, pageParameter(1), limitParameter(20)],
        responses: {
          200: jsonResponse('Paged review comments for moderation', pagedEnvelope('ContentComment')),
          ...pickErrors([400, 401, 403, 500])
        }
      })
    },
    '/admin/moderation/article-comments': {
      get: adminOperation({
        tags: ['Admin'],
        summary: 'Article comment moderation queue',
        parameters: [moderationStatusParameter, pageParameter(1), limitParameter(20)],
        responses: {
          200: jsonResponse('Paged article comments for moderation', pagedEnvelope('ContentComment')),
          ...pickErrors([400, 401, 403, 500])
        }
      })
    },
    '/admin/books/{id}/status': {
      patch: adminOperation({
        tags: ['Admin'],
        summary: 'Moderate book status',
        parameters: [uuidPathParameter('id', 'Book id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('BookStatusRequest'))
        },
        responses: {
          200: jsonResponse('Book moderated', itemEnvelope('Book')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/admin/reviews/{id}/status': {
      patch: adminOperation({
        tags: ['Admin'],
        summary: 'Moderate review status',
        parameters: [uuidPathParameter('id', 'Review id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ModerationStatusRequest'))
        },
        responses: {
          200: jsonResponse('Review moderated', itemEnvelope('Review')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/admin/articles/{id}/status': {
      patch: adminOperation({
        tags: ['Admin'],
        summary: 'Moderate article status',
        parameters: [uuidPathParameter('id', 'Article id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ModerationStatusRequest'))
        },
        responses: {
          200: jsonResponse('Article moderated', itemEnvelope('Article')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/admin/review-comments/{id}/status': {
      patch: adminOperation({
        tags: ['Admin'],
        summary: 'Moderate review comment status',
        parameters: [uuidPathParameter('id', 'Review comment id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ModerationStatusRequest'))
        },
        responses: {
          200: jsonResponse('Review comment moderated', itemEnvelope('ContentComment')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    },
    '/admin/article-comments/{id}/status': {
      patch: adminOperation({
        tags: ['Admin'],
        summary: 'Moderate article comment status',
        parameters: [uuidPathParameter('id', 'Article comment id')],
        requestBody: {
          required: true,
          content: jsonContent(ref('ModerationStatusRequest'))
        },
        responses: {
          200: jsonResponse('Article comment moderated', itemEnvelope('ContentComment')),
          ...pickErrors([400, 401, 403, 404, 500])
        }
      })
    }
  }
};

export function getSwaggerHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bookpoisk API Docs</title>
    <link rel="stylesheet" href="/api/docs/assets/swagger-ui.css" />
    <style>
      :root {
        color-scheme: light;
      }

      body {
        margin: 0;
        background: linear-gradient(180deg, #fff8f0 0%, #f8f3ed 100%);
      }

      .swagger-ui .topbar {
        display: none;
      }

      .swagger-ui .information-container {
        padding-bottom: 0;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/assets/swagger-ui-bundle.js"></script>
    <script src="/api/docs/assets/swagger-ui-standalone-preset.js"></script>
    <script>
      window.addEventListener('load', () => {
        window.ui = SwaggerUIBundle({
          url: '/api/docs/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          displayRequestDuration: true,
          persistAuthorization: true,
          validatorUrl: null,
          tryItOutEnabled: true,
          filter: true,
          docExpansion: 'list',
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 2,
          requestInterceptor: (request) => {
            request.credentials = 'same-origin';
            return request;
          },
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout'
        });
      });
    </script>
  </body>
</html>`;
}
