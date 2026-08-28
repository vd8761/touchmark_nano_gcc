"use client";

import React, { useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  DecoupledEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Font,
  FontColor,
  FontBackgroundColor,
  FontFamily,
  FontSize,
  Heading,
  Alignment,
  List,
  ListProperties,
  Indent,
  IndentBlock,
  Link,
  AutoLink,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  TableCaption,
  BlockQuote,
  Code,
  CodeBlock,
  HorizontalLine,
  RemoveFormat,
  FindAndReplace,
  SpecialCharacters,
  SpecialCharactersEssentials,
  GeneralHtmlSupport,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";

interface CKEditorWrapperProps {
  value: string;
  onChange: (val: string) => void;
  toolbarContainerId: string;
}

export default function CKEditorWrapper({ value, onChange, toolbarContainerId }: CKEditorWrapperProps) {
  return (
    <>
      <style>{`
        /* A4 document styling for the DecoupledEditor */
        .ck-editor__editable.ck-editor__editable_inline {
          min-height: 1056px !important;
          padding: 96px !important;
          background: white !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) !important;
          font-family: "Times New Roman", Times, serif !important;
          font-size: 11pt !important;
          line-height: 1.6 !important;
          color: #000 !important;
          max-width: 816px;
          margin: 0 auto;
          border: none !important;
          outline: none !important;
        }
        /* Decoupled toolbar container styling */
        .ck-decoupled-toolbar {
          background: #f1f3f4;
          border: 1px solid #dadce0;
          border-radius: 8px 8px 0 0;
          padding: 4px 8px;
          display: flex;
          flex-wrap: wrap;
          min-height: 48px;
        }
        .ck-decoupled-toolbar .ck.ck-toolbar {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          flex-wrap: wrap !important;
          width: 100%;
        }
        /* Table styling inside editor */
        .ck-editor__editable table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          table-layout: auto;
        }
        .ck-editor__editable table td,
        .ck-editor__editable table th {
          border: 1px solid #000 !important;
          padding: 12px 14px !important;
          vertical-align: top !important;
          min-width: 80px;
          line-height: 1.8;
        }
        /* All CKEditor balloon panels and dropdowns must float above everything */
        .ck.ck-balloon-panel,
        .ck.ck-dropdown__panel,
        .ck-body-wrapper .ck-balloon-panel {
          z-index: 99999 !important;
        }
      `}</style>
      <CKEditor
        editor={DecoupledEditor}
        data={value}
        onReady={(editor: any) => {
          // Append the toolbar into our dedicated sticky container
          const toolbarContainer = document.getElementById(toolbarContainerId);
          if (toolbarContainer && editor.ui.view.toolbar.element) {
            toolbarContainer.innerHTML = ""; // clear any previous toolbar
            toolbarContainer.appendChild(editor.ui.view.toolbar.element);
          }
        }}
        onChange={(_event: any, editor: any) => {
          onChange(editor.getData());
        }}
        config={{
          licenseKey: 'GPL',
          plugins: [
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Subscript,
            Superscript,
            FontFamily,
            FontSize,
            FontColor,
            FontBackgroundColor,
            Font,
            Heading,
            Alignment,
            List,
            ListProperties,
            Indent,
            IndentBlock,
            Link,
            AutoLink,
            Table,
            TableToolbar,
            TableProperties,
            TableCellProperties,
            TableColumnResize,
            TableCaption,
            BlockQuote,
            Code,
            CodeBlock,
            HorizontalLine,
            RemoveFormat,
            FindAndReplace,
            SpecialCharacters,
            SpecialCharactersEssentials,
            GeneralHtmlSupport,
          ],
          toolbar: {
            items: [
              'undo', 'redo',
              '|',
              'findAndReplace',
              '|',
              'heading',
              '|',
              'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor',
              '|',
              'bold', 'italic', 'underline', 'strikethrough',
              '|',
              'subscript', 'superscript',
              '|',
              'removeFormat',
              '|',
              'alignment',
              '|',
              'bulletedList', 'numberedList',
              '|',
              'outdent', 'indent',
              '|',
              'link',
              '|',
              'insertTable',
              '|',
              'blockQuote', 'codeBlock', 'code',
              '|',
              'horizontalLine', 'specialCharacters',
            ],
            shouldNotGroupWhenFull: true,
          },
          fontFamily: {
            options: [
              'default',
              'Arial, Helvetica, sans-serif',
              'Courier New, Courier, monospace',
              'Georgia, serif',
              'Times New Roman, Times, serif',
              'Trebuchet MS, Helvetica, sans-serif',
              'Verdana, Geneva, sans-serif',
              'Tahoma, Geneva, sans-serif',
            ],
            supportAllValues: true,
          },
          fontSize: {
            options: [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72],
            supportAllValues: true,
          },
          heading: {
            options: [
              { model: 'paragraph' as any, title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading1' as any, view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
              { model: 'heading2' as any, view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3' as any, view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
              { model: 'heading4' as any, view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
            ],
          },
          table: {
            contentToolbar: [
              'tableColumn', 'tableRow', 'mergeTableCells',
              '|',
              'tableProperties', 'tableCellProperties',
              '|',
              'toggleTableCaption',
            ],
          },
          list: {
            properties: {
              styles: true,
              startIndex: true,
              reversed: true,
            },
          },
          htmlSupport: {
            allow: [
              { name: /.*/, attributes: true, classes: true, styles: true },
            ],
          },
          link: {
            decorators: {
              openInNewTab: {
                mode: 'manual' as any,
                label: 'Open in a new tab',
                attributes: { target: '_blank', rel: 'noopener noreferrer' },
              },
            },
          },
        }}
      />
    </>
  );
}
