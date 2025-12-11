'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

interface ActionsMenuProps {
  onEdit: () => void;
  onChangePassword?: () => void;
  customActions?: CustomAction[];
  editDisabled?: boolean;
  showEdit?: boolean; // Si es false, no muestra la opción Editar
}

export default function ActionsMenu({ onEdit, onChangePassword, customActions = [], editDisabled = false, showEdit = true }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Actualizar posición del menú cuando se abre o se hace scroll
  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: buttonRect.bottom + 4,
        left: buttonRect.right - 192, // 192px = w-48 (ancho del menú)
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
    }
  }, [isOpen]);

  // Actualizar posición durante scroll y resize
  useEffect(() => {
    if (isOpen) {
      const handleScroll = () => {
        updateMenuPosition();
      };
      
      const handleResize = () => {
        updateMenuPosition();
      };

      // Usar capture phase para capturar scroll en todos los contenedores
      document.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        document.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        menuRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const menuContent = isOpen && typeof window !== 'undefined' ? (
    createPortal(
      <div
        ref={menuRef}
        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999]"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
        onScroll={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          {showEdit && (
            <button
              onClick={() => {
                if (!editDisabled) {
                  onEdit();
                  setIsOpen(false);
                }
              }}
              disabled={editDisabled}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                editDisabled
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar
            </button>
          )}
          {onChangePassword && (
            <button
              onClick={() => {
                onChangePassword();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Cambiar contraseña
            </button>
          )}
          {customActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                if (!action.disabled) {
                  action.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={action.disabled}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                action.disabled
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                  : `hover:bg-gray-100 dark:hover:bg-gray-700 ${action.className || 'text-gray-700 dark:text-gray-300'}`
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5 text-gray-600 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
      {menuContent}
    </>
  );
}

