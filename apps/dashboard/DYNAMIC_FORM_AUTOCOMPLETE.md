# Dynamic Form Autocomplete Feature

The Dynamic Form now supports autocomplete functionality for both `select` and `multiselect` field types. This feature allows fields to be editable and fetch data dynamically as the user types.

## Features

- **Editable Select/Multiselect**: Fields become text inputs that support typing
- **Dynamic Data Fetching**: Query data from APIs as user types
- **Debounced Search**: Configurable delay to prevent excessive API calls
- **Minimum Search Length**: Set minimum characters before search triggers
- **Loading States**: Built-in loading indicators during searches
- **Error Handling**: Graceful error handling for failed searches
- **FreeSolo Mode**: Allow custom values not in the options list
- **Customizable Messages**: Configure no options and loading text

## Configuration Options

### Basic Properties

```typescript
interface DynamicFormSelectField {
  // ... existing properties
  
  // Autocomplete functionality
  autocomplete?: boolean;                    // Enable autocomplete mode
  onSearch?: (searchTerm: string) => Promise<Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>>;                                      // Search function
  freeSolo?: boolean;                       // Allow custom values
  loading?: boolean;                        // External loading state
  minSearchLength?: number;                 // Min chars before search (default: 1)
  searchDelay?: number;                     // Search debounce delay (default: 300ms)
  noOptionsText?: string;                   // Text when no options (default: 'No options')
  loadingText?: string;                     // Loading text (default: 'Loading...')
}
```

## Usage Examples

### 1. Basic Autocomplete Select

```typescript
const searchUsers = async (searchTerm: string) => {
  const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
  const users = await response.json();
  return users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`,
  }));
};

const userSelectField: DynamicFormSelectField = {
  id: 'userId',
  name: 'userId',
  type: 'select',
  label: 'Select User',
  autocomplete: true,
  onSearch: searchUsers,
  options: [], // Initial options (can be empty for autocomplete-only)
  minSearchLength: 2,
  searchDelay: 500,
  noOptionsText: 'No users found',
  loadingText: 'Searching users...',
};
```

### 2. Multiselect with Autocomplete

```typescript
const searchTags = async (searchTerm: string) => {
  const response = await fetch(`/api/tags/search?term=${searchTerm}`);
  const tags = await response.json();
  return tags.map(tag => ({
    value: tag.id,
    label: tag.name,
  }));
};

const tagsField: DynamicFormSelectField = {
  id: 'tags',
  name: 'tags',
  type: 'multiselect',
  label: 'Select Tags',
  autocomplete: true,
  onSearch: searchTags,
  freeSolo: true, // Allow creating new tags
  options: [
    { value: 'popular', label: 'Popular' },
    { value: 'featured', label: 'Featured' },
  ], // Pre-defined options
  minSearchLength: 1,
  searchDelay: 300,
};
```

### 3. With React Query Integration

```typescript
import { useQuery } from '@tanstack/react-query';

const usePropertySearch = () => {
  const searchProperties = async (searchTerm: string) => {
    const response = await fetch(`/api/properties/search?name=${searchTerm}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  };

  return { searchProperties };
};

// In your component
const { searchProperties } = usePropertySearch();

const propertyField: DynamicFormSelectField = {
  id: 'propertyId',
  name: 'propertyId',
  type: 'select',
  label: 'Property',
  autocomplete: true,
  onSearch: async (searchTerm: string) => {
    try {
      const properties = await searchProperties(searchTerm);
      return properties.map(property => ({
        value: property.id,
        label: property.name,
        disabled: !property.available,
      }));
    } catch (error) {
      console.error('Property search failed:', error);
      return [];
    }
  },
  options: [],
  minSearchLength: 3,
  searchDelay: 400,
  noOptionsText: 'No properties found',
  loadingText: 'Searching properties...',
};
```

### 4. Complete Form Example

```typescript
import { useForm } from 'react-hook-form';
import { DynamicForm } from 'src/components/dynamic-form';

interface FormData {
  userId: string;
  tags: string[];
  propertyId: string;
}

export function AutocompleteFormExample() {
  const methods = useForm<FormData>();

  const searchUsers = async (searchTerm: string) => {
    // Your user search implementation
    const response = await fetch(`/api/users/search?q=${searchTerm}`);
    return response.json();
  };

  const searchTags = async (searchTerm: string) => {
    // Your tags search implementation  
    const response = await fetch(`/api/tags/search?term=${searchTerm}`);
    return response.json();
  };

  const formSections = [
    {
      id: 'main',
      title: 'Autocomplete Example',
      fields: [
        {
          id: 'userId',
          name: 'userId',
          type: 'select',
          label: 'Select User',
          autocomplete: true,
          onSearch: searchUsers,
          options: [],
          minSearchLength: 2,
          required: true,
        } as DynamicFormSelectField,
        {
          id: 'tags',
          name: 'tags', 
          type: 'multiselect',
          label: 'Tags',
          autocomplete: true,
          onSearch: searchTags,
          freeSolo: true,
          options: [
            { value: 'urgent', label: 'Urgent' },
            { value: 'important', label: 'Important' },
          ],
        } as DynamicFormSelectField,
      ],
    },
  ];

  return (
    <DynamicForm
      sections={formSections}
      methods={methods}
      onSubmit={(data) => console.log('Form data:', data)}
    />
  );
}
```

## Best Practices

### 1. Performance Optimization

```typescript
// Use debouncing to limit API calls
const searchField: DynamicFormSelectField = {
  // ... other props
  searchDelay: 500, // Wait 500ms after user stops typing
  minSearchLength: 3, // Only search after 3+ characters
};
```

### 2. Error Handling

```typescript
const robustSearch = async (searchTerm: string) => {
  try {
    const response = await fetch(`/api/search?q=${searchTerm}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Search failed:', error);
    // Return empty array or cached results
    return [];
  }
};
```

### 3. Caching Results

```typescript
const searchCache = new Map<string, any[]>();

const cachedSearch = async (searchTerm: string) => {
  const cacheKey = searchTerm.toLowerCase().trim();
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }
  
  const results = await fetch(`/api/search?q=${searchTerm}`).then(r => r.json());
  searchCache.set(cacheKey, results);
  return results;
};
```

### 4. Server-Side Integration

```javascript
// Express.js endpoint example
app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const users = await User.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }).limit(20);
    
    res.json(users.map(user => ({
      value: user._id,
      label: `${user.firstName} ${user.lastName}`,
      disabled: !user.active,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});
```

## Migration Guide

### From Static Select to Autocomplete

Before:
```typescript
{
  type: 'select',
  options: [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ],
}
```

After:
```typescript
{
  type: 'select',
  autocomplete: true,
  onSearch: searchFunction,
  options: [], // Can be empty or contain initial options
}
```

## TypeScript Support

The autocomplete feature is fully typed with TypeScript:

```typescript
import type { DynamicFormSelectField } from 'src/components/dynamic-form/types';

// Type-safe search function
const typedSearch = async (searchTerm: string): Promise<Array<{
  value: string | number;
  label: string;
  disabled?: boolean;
}>> => {
  // Your implementation
  return [];
};
```