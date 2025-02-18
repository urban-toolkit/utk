# UTK grammar schema

The grammar that powers UTK is validated through JSON Schema. Learn more about it [here](https://json-schema.org/).

We recommend using this page as a detailed reference of what is possible or not in UTK.

## Main schema


```json
{
  "$id": "https://urbantk.org/grammar",
  "title": "Grammar",
  "description": "A grammar to produce visual analytics systems",
  "type": "object",
  "properties": {
    "components": {
      "description": "Stores the components that will visually compose the dashboard",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "map": {
            "type": "object",
            "properties": {
              "camera": {
                "type": "object",
                "properties": {
                  "position": {
                    "type": "array",
                    "minItems": 3,
                    "maxItems": 3,
                    "items": {
                        "type": "number"
                    }
                  },
                  "direction": {
                    "type": "object",
                    "properties": {
                      "right": {
                        "type": "array",
                        "minItems": 3,
                        "maxItems": 3,
                        "items": {
                          "type": "number"
                        }
                      },
                      "lookAt": {
                        "type": "array",
                        "minItems": 3,
                        "maxItems": 3,
                        "items": {
                          "type": "number"
                        }
                      },
                      "up": {
                        "type": "array",
                        "minItems": 3,
                        "maxItems": 3,
                        "items": {
                          "type": "number"
                        }
                      }
                    }
                  }
                }
              },
              "knots": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "interactions": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "filterKnots": {
                "type": "array",
                "minItems": 4,
                "maxItems": 4,
                "items": {
                  "type": "number"
                }
              },
              "knotVisibility": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "knot": {
                      "type": "string"
                    },
                    "test": {
                      "type": "string"
                    }
                  },
                  "required": ["knot", "test"]
                }
              }
            },
            "required": ["camera", "knots", "interactions"]
          },
          "plots": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "plot": {
                  "type": "object",
                  "additionalProperties": true
                },
                "knots": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "arrangement": {
                  "type": "string"
                },
                "interaction": {
                  "type": "string"
                },
                "args": {
                  "type": "object",
                  "properties": {
                    "bins": {
                      "type": "number"
                    }
                  }
                }
              },
              "required": ["plot", "knots", "arrangement"]
            }
          },
          "knots": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "group": {
                  "type": "object",
                  "properties": {
                    "group_name": {
                      "type": "string"
                    },
                    "position": {
                      "type": "number"
                    }
                  },
                  "required": ["group_name", "position"]
                },
                "knotOp": {
                  "type": "boolean"
                },
                "colorMap": {
                  "type": "string"
                },
                "integration_scheme": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "spatial_relation": {
                        "type": "string"
                      },
                      "out": {
                        "type": "object",
                        "properties": {
                          "name": {
                            "type": "string"
                          },
                          "level": {
                            "type": "string"
                          }
                        }
                      },
                      "in": {
                        "type": "object",
                        "properties": {
                          "name": {
                            "type": "string"
                          },
                          "level": {
                            "type": "string"
                          }
                        }
                      },
                      "operation": {
                        "type": "string"
                      },
                      "abstract": {
                        "type": "boolean"
                      },
                      "op": {
                        "type": "string"
                      },
                      "maxDistance": {
                        "type": "number"
                      },
                      "defaultValue": {
                        "type": "number"
                      }
                    },
                    "required": ["out"],
                    "dependentRequired": {
                      "in": ["spatial_relation"]
                    }
                  }
                }
              },
              "required": ["id", "integration_scheme"]
            }
          },
          "position": {
            "type": "object",
            "properties": {
              "width": {
                "type": "array",
                "minItems": 2,
                "maxItems": 2,
                "items": {
                  "type": "integer"
                }
              },
              "height": {
                "type": "array",
                "minItems": 2,
                "maxItems": 2,
                "items": {
                  "type": "integer"
                }
              }
            },
            "required": ["width", "height"]
          },
          "type": {
            "type": "string"
          },
          "map_id": {
            "type": "integer"
          },
          "title": {
            "type": "string"
          },
          "subtitle": {
            "type": "string"
          },
          "categories": {
            "#ref": "categories"
          }
        },
        "required": ["position"],
        "dependentRequired": {
          "map": ["plots", "knots"],
          "plots": ["map", "knots"],
          "knots": ["map", "plots"]
        }
      }
    },
    "grid": {
      "description": "Defines how the screen should be divided",
      "type": "object",
      "properties": {
        "width": {
          "type": "integer"
        },
        "height": {
          "type": "integer"
        }
      },
      "required": ["width", "height"]
    }
  },
  "required": ["grid", "components"]
}
```

## Categories recursive schema

This is a sub-schema that defines the "categories" functionality, where it is possible to group knots under different categories. Because it is a recursive structure we decide to define it in a separate schema.


```json
{
  "$id": "https://urbantk.org/categories",
  "description": "Categories schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "category_name": {
        "type": "string"
      },
      "elements": {
        "type": "array",
        "items": {
          "anyOf": [
            {"type": "string"},
            {"#ref": "#"}
          ]
        }
      }
    }
  }
}
```