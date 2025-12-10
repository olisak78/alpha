// Dog Breeds Explorer Plugin (ES module)
// Fetches dog breed data from the Dog API and displays it in a searchable table
// This bundle expects `React` to be available globally from the host application.

const DogBreedsPlugin = ({ context }) => {
  const { useEffect, useState, useMemo } = React;
  
  // State management
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Theme colors
  const colors = useMemo(() => ({
    background: context.theme.colors.background,
    border: context.theme.colors.border,
    text: context.theme.colors.foreground,
    accent: context.theme.colors.accent,
    muted: context.theme.colors.muted,
    mutedText: context.theme.mode === 'dark' ? '#9ca3af' : '#6b7280',
  }), [context.theme]);

  // Fetch dog breeds on mount
  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://api.thedogapi.com/v1/breeds?limit=50');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch breeds: ${response.status}`);
        }
        
        const data = await response.json();
        setBreeds(data);
        context.utils.toast('Dog breeds loaded successfully!', 'success');
      } catch (err) {
        setError(err.message);
        context.utils.toast(`Error: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBreeds();
  }, []);

  // Filter and sort breeds
  const filteredAndSortedBreeds = useMemo(() => {
    let result = [...breeds];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(breed => 
        breed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (breed.bred_for && breed.bred_for.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (breed.breed_group && breed.breed_group.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle numeric fields
      if (sortField === 'weight' || sortField === 'height') {
        const aMetric = a[sortField]?.metric || '0';
        const bMetric = b[sortField]?.metric || '0';
        aVal = parseInt(aMetric.split('-')[0]) || 0;
        bVal = parseInt(bMetric.split('-')[0]) || 0;
      } else if (sortField === 'life_span') {
        aVal = parseInt(aVal.split('-')[0]) || 0;
        bVal = parseInt(bVal.split('-')[0]) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [breeds, searchTerm, sortField, sortDirection]);

  // Handle sort column click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render loading state
  if (loading) {
    return React.createElement(
      'div',
      {
        style: {
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          minHeight: '300px',
          justifyContent: 'center',
        },
      },
      [
        React.createElement('div', {
          key: 'spinner',
          style: {
            width: '40px',
            height: '40px',
            border: `4px solid ${colors.muted}`,
            borderTopColor: colors.accent,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          },
        }),
        React.createElement('p', {
          key: 'text',
          style: { color: colors.mutedText, fontSize: '14px', margin: 0 },
        }, 'Loading dog breeds...'),
      ]
    );
  }

  // Render error state
  if (error) {
    return React.createElement(
      'div',
      {
        style: {
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          color: colors.text,
        },
      },
      [
        React.createElement('h3', {
          key: 'title',
          style: { color: '#ef4444', margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 },
        }, 'Error Loading Data'),
        React.createElement('p', {
          key: 'message',
          style: { margin: 0, fontSize: '14px', color: colors.mutedText },
        }, error),
      ]
    );
  }

  // Render main content
  return React.createElement(
    'div',
    {
      style: {
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px',
        color: colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      },
    },
    [
      // Header section
      React.createElement('div', {
        key: 'header',
        style: { display: 'flex', flexDirection: 'column', gap: '12px' },
      }, [
        React.createElement('div', {
          key: 'title-row',
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        }, [
          React.createElement('div', {
            key: 'title-section',
            style: { display: 'flex', alignItems: 'center', gap: '8px' },
          }, [
            React.createElement('span', {
              key: 'icon',
              style: { fontSize: '24px' },
            }, '🐕'),
            React.createElement('h2', {
              key: 'title',
              style: { margin: 0, fontSize: '18px', fontWeight: 600 },
            }, 'Dog Breeds Explorer'),
          ]),
          React.createElement('div', {
            key: 'stats',
            style: {
              background: colors.accent,
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
            },
          }, `${filteredAndSortedBreeds.length} breeds`),
        ]),
        // Search input
        React.createElement('input', {
          key: 'search',
          type: 'text',
          placeholder: 'Search by name, purpose, or breed group...',
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          style: {
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            background: colors.background,
            color: colors.text,
            fontSize: '14px',
            outline: 'none',
          },
        }),
      ]),

      // Table
      React.createElement('div', {
        key: 'table-container',
        style: {
          overflowX: 'auto',
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
        },
      }, [
        React.createElement('table', {
          key: 'table',
          style: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          },
        }, [
          // Table header
          React.createElement('thead', { key: 'thead' }, [
            React.createElement('tr', {
              key: 'header-row',
              style: {
                background: colors.muted,
                borderBottom: `1px solid ${colors.border}`,
              },
            }, [
              ['name', 'Breed Name'],
              ['breed_group', 'Group'],
              ['bred_for', 'Bred For'],
              ['temperament', 'Temperament'],
              ['life_span', 'Life Span'],
            ].map(([field, label]) =>
              React.createElement('th', {
                key: field,
                onClick: () => handleSort(field),
                style: {
                  padding: '12px',
                  textAlign: 'left',
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                },
              }, [
                label,
                sortField === field && React.createElement('span', {
                  key: 'arrow',
                  style: { marginLeft: '4px', fontSize: '10px' },
                }, sortDirection === 'asc' ? '▲' : '▼'),
              ])
            )),
          ]),
          // Table body
          React.createElement('tbody', { key: 'tbody' },
            filteredAndSortedBreeds.length === 0
              ? React.createElement('tr', { key: 'no-results' }, [
                  React.createElement('td', {
                    key: 'cell',
                    colSpan: 5,
                    style: {
                      padding: '24px',
                      textAlign: 'center',
                      color: colors.mutedText,
                    },
                  }, 'No breeds found matching your search'),
                ])
              : filteredAndSortedBreeds.map((breed, idx) =>
                  React.createElement('tr', {
                    key: breed.id || idx,
                    style: {
                      borderBottom: `1px solid ${colors.border}`,
                      transition: 'background-color 0.15s',
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.backgroundColor = colors.muted;
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    },
                  }, [
                    React.createElement('td', {
                      key: 'name',
                      style: {
                        padding: '12px',
                        fontWeight: 500,
                      },
                    }, breed.name || '-'),
                    React.createElement('td', {
                      key: 'group',
                      style: { padding: '12px' },
                    }, breed.breed_group || '-'),
                    React.createElement('td', {
                      key: 'bred_for',
                      style: {
                        padding: '12px',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }, breed.bred_for || '-'),
                    React.createElement('td', {
                      key: 'temperament',
                      style: {
                        padding: '12px',
                        maxWidth: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }, breed.temperament || '-'),
                    React.createElement('td', {
                      key: 'life_span',
                      style: {
                        padding: '12px',
                        whiteSpace: 'nowrap',
                      },
                    }, breed.life_span || '-'),
                  ])
                )
          ),
        ]),
      ]),

      // Footer
      React.createElement('div', {
        key: 'footer',
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: colors.mutedText,
        },
      }, [
        React.createElement('span', { key: 'info' }, 'Data from TheDogAPI.com'),
        React.createElement('span', { key: 'version' }, `v${context.metadata.version}`),
      ]),
    ]
  );
};

// Add CSS animation for spinner (injected once)
if (typeof document !== 'undefined' && !document.getElementById('dog-plugin-styles')) {
  const style = document.createElement('style');
  style.id = 'dog-plugin-styles';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default {
  component: DogBreedsPlugin,
  metadata: {
    name: 'dog-breeds-explorer',
    version: '1.0.0',
    author: 'Portal Team',
  },
  hooks: {
    onMount() {
      console.log('[Dog Breeds Plugin] mounted');
    },
    onUnmount() {
      console.log('[Dog Breeds Plugin] unmounted');
    },
  },
};