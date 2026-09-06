import { useState, useEffect, useCallback } from 'react';
import {
  subscribeFSEvents,
  registerCustomNode,
  renameNodeInTree,
  deleteNodeFromTree,
  updateNodeBodyInTree,
  findNode,
  getParentId,
  subscribeFSSync,
  syncFSToServer
} from '../data/ishantOS';

import { isYouTubeUrl, getYouTubeThumbnail, getYouTubeEmbedUrl } from './mediaHelpers';
import { checkIsAdmin } from './useAdminAuth';
import { playMacClick } from './macAudioEngine';
import {
  useClipboard,
  getClipboard,
  generateCopyName,
  cloneNodeRecursive
} from './fsClipboard';

export function useFileSystem() {
  const [version, setVersion] = useState(0);
  const [syncStatus, setSyncStatus] = useState({ status: 'idle', message: '', lastSynced: null });

  useEffect(() => {
    return subscribeFSEvents(() => {
      setVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    return subscribeFSSync((status) => {
      setSyncStatus(status);
    });
  }, []);

  const addFolder = useCallback(async (parentId, folderName = 'untitled folder') => {
    const id = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newFolder = {
      id,
      name: folderName,
      kind: 'folder',
      description: 'Folder',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      modifiedAt: 'Just now',
      children: [],
      isCustom: true,
      meta: {
        owner: 'Ishant (Admin)',
        size: '0 items'
      }
    };

    const ok = await registerCustomNode(parentId, newFolder);
    return ok ? newFolder : null;
  }, []);

  const addFile = useCallback(async (parentId, filePayload) => {
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newFile = {
      id,
      name: filePayload.name || 'untitled',
      kind: filePayload.kind || 'file',
      description: filePayload.description || 'Uploaded file',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      modifiedAt: 'Just now',
      isCustom: true,
      ...filePayload
    };

    const ok = await registerCustomNode(parentId, newFile);
    return ok ? newFile : null;
  }, []);

  const addWorkLink = useCallback(async (parentId, linkPayload) => {
    const id = `work-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const isYt = linkPayload.platform === 'youtube' || isYouTubeUrl(linkPayload.href);
    const ytThumb = isYt ? getYouTubeThumbnail(linkPayload.href) : null;
    const embedUrl = isYt ? getYouTubeEmbedUrl(linkPayload.href) : linkPayload.href;
    const thumbnail = linkPayload.thumbnailUrl || ytThumb || '';

    const newLinkNode = {
      id,
      name: linkPayload.name,
      kind: linkPayload.openMode === 'embed' && (isYt || linkPayload.platform === 'video') ? 'video' : 'link',
      description: linkPayload.description || (isYt ? 'YouTube Video' : 'Web Link'),
      href: linkPayload.href,
      videoUrl: embedUrl,
      platform: linkPayload.platform || (isYt ? 'youtube' : 'link'),
      thumbnailUrl: thumbnail,
      preview: thumbnail,
      openMode: linkPayload.openMode || 'embed',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      modifiedAt: 'Just now',
      isCustom: true,
      meta: {
        owner: 'Ishant (Admin)',
        target: linkPayload.href
      }
    };

    const ok = await registerCustomNode(parentId, newLinkNode);
    return ok ? newLinkNode : null;
  }, []);

  const renameNode = useCallback(async (nodeId, newName) => {
    if (!checkIsAdmin()) {
      console.warn('Unauthorized: Renaming is only permitted in Admin Mode.');
      return false;
    }
    if (!newName || !newName.trim()) return false;
    return await renameNodeInTree(nodeId, newName.trim());
  }, []);

  const updateFileContent = useCallback(async (nodeId, newBody) => {
    return await updateNodeBodyInTree(nodeId, newBody);
  }, []);

  const deleteNode = useCallback(async (nodeId) => {
    if (!checkIsAdmin()) {
      console.warn('Unauthorized: Deleting is only permitted in Admin Mode.');
      return false;
    }
    return await deleteNodeFromTree(nodeId);
  }, []);

  const { clipboard, copy: copyNode, cut: cutNode, clear: clearClipboard } = useClipboard();

  const pasteNode = useCallback(async (targetParentId = 'home') => {
    if (!checkIsAdmin()) {
      console.warn('Unauthorized: Pasting is only permitted in Admin Mode.');
      return null;
    }
    const { node: sourceNode } = getClipboard();
    if (!sourceNode) return null;

    const parent = findNode(targetParentId);
    if (!parent) return null;

    const existingNames = (parent.children || []).map((c) => c.name);
    const newName = generateCopyName(existingNames, sourceNode.name);

    const cloned = cloneNodeRecursive(sourceNode, newName);
    const ok = await registerCustomNode(targetParentId, cloned);
    if (ok) {
      playMacClick(false);
      return cloned;
    }
    return null;
  }, []);

  const duplicateNode = useCallback(async (nodeId, customParentId = null) => {
    if (!checkIsAdmin()) {
      console.warn('Unauthorized: Duplicating is only permitted in Admin Mode.');
      return null;
    }
    const sourceNode = findNode(nodeId);
    if (!sourceNode) return null;
    const parentId = customParentId || getParentId(nodeId) || 'home';
    const parent = findNode(parentId);
    if (!parent) return null;

    const existingNames = (parent.children || []).map((c) => c.name);
    const newName = generateCopyName(existingNames, sourceNode.name);

    const cloned = cloneNodeRecursive(sourceNode, newName);
    const ok = await registerCustomNode(parentId, cloned);
    if (ok) {
      playMacClick(false);
      return cloned;
    }
    return null;
  }, []);

  return {
    version,
    syncStatus,
    syncFSToServer,
    addFolder,
    addFile,
    addWorkLink,
    renameNode,
    updateFileContent,
    deleteNode,
    findNode,
    clipboard,
    copyNode,
    cutNode,
    clearClipboard,
    pasteNode,
    duplicateNode
  };
}
