/**
 * Centralized Window Exports Module
 * 
 * This module provides a single place to manage all window.* assignments,
 * reducing global namespace pollution and making it easier to track what's exposed.
 * 
 * Modules should register their exports here rather than directly assigning to window.
 */

const WindowExports = (function() {
    'use strict';
    
    /**
     * Registry of exports by module name
     * Format: { moduleName: { exportName: value } }
     */
    const exportsRegistry = {};
    
    /**
     * Register exports from a module
     * @param {string} moduleName - Name of the module (e.g., 'TestManager', 'Navigation')
     * @param {Object} exports - Object with exportName: value pairs
     */
    function register(moduleName, exports) {
        if (!exportsRegistry[moduleName]) {
            exportsRegistry[moduleName] = {};
        }
        Object.assign(exportsRegistry[moduleName], exports);
    }
    
    /**
     * Expose all registered exports to window
     * Should be called after all modules have loaded
     */
    function exposeAll() {
        if (typeof window === 'undefined') {
            return;
        }
        
        // Expose all registered exports
        for (const moduleName in exportsRegistry) {
            for (const exportName in exportsRegistry[moduleName]) {
                window[exportName] = exportsRegistry[moduleName][exportName];
            }
        }
    }
    
    /**
     * Expose specific exports from a module
     * @param {string} moduleName - Name of the module
     * @param {Array<string>} exportNames - Array of export names to expose
     */
    function expose(moduleName, exportNames) {
        if (typeof window === 'undefined' || !exportsRegistry[moduleName]) {
            return;
        }
        
        exportNames.forEach(exportName => {
            if (exportsRegistry[moduleName][exportName]) {
                window[exportName] = exportsRegistry[moduleName][exportName];
            }
        });
    }
    
    /**
     * Get an export value without exposing to window
     * @param {string} moduleName - Name of the module
     * @param {string} exportName - Name of the export
     * @returns {*} The export value or undefined
     */
    function get(moduleName, exportName) {
        if (exportsRegistry[moduleName] && exportsRegistry[moduleName][exportName]) {
            return exportsRegistry[moduleName][exportName];
        }
        return undefined;
    }
    
    return {
        register,
        exposeAll,
        expose,
        get
    };
})();

// Expose WindowExports itself for modules to use
if (typeof window !== 'undefined') {
    window.WindowExports = WindowExports;
}
