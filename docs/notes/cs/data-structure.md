---
title: 数据结构基础 - 程序设计核心
date: 2026-03-27
tags: [数据结构, 算法, 链表, 树, 图]
description: 深入理解数据结构基础，掌握线性表、树、图、哈希表等核心数据结构
---

# 数据结构基础

## 什么是数据结构？

数据结构是 **数据的组织、管理和存储方式**。它定义了数据元素之间的关系，以及对数据的操作方式。好的数据结构可以提高程序的效率和可维护性。

### 数据结构分类

```
┌─────────────────────────────────────────────────────────────┐
│                    数据结构分类                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    线性结构                          │   │
│  │  数组、链表、栈、队列                                 │   │
│  │  元素之间是一对一的关系                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    树形结构                          │   │
│  │  二叉树、AVL 树、红黑树、B 树                         │   │
│  │  元素之间是一对多的层次关系                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    图形结构                          │   │
│  │  有向图、无向图、加权图                               │   │
│  │  元素之间是多对多的关系                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    集合结构                          │   │
│  │  哈希表、并查集、布隆过滤器                           │   │
│  │  元素之间没有顺序关系                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 时间复杂度

```c
常见时间复杂度 (从小到大):

O(1)      常数复杂度    数组随机访问
O(log n)  对数复杂度    二分查找
O(n)      线性复杂度    遍历数组
O(n log n) 线性对数     快速排序、归并排序
O(n²)     平方复杂度    冒泡排序、选择排序
O(n³)     立方复杂度    矩阵乘法 (朴素)
O(2ⁿ)     指数复杂度    斐波那契递归
O(n!)     阶乘复杂度    全排列
```

```
┌─────────────────────────────────────────────────────────────┐
│                    复杂度增长曲线                            │
│                                                             │
│  运算次数                                                   │
│      │                                                      │
│  n!  │                              *                       │
│      │                           *                          │
│  2ⁿ  │                        *                             │
│      │                     *                                │
│  n²  │                  *                                   │
│      │               *                                      │
│nlogn │            *                                         │
│      │         *                                            │
│   n  │      *                                               │
│      │   *                                                  │
│ logn │*                                                     │
│      │                                                      │
│   1  ├───────────────────────────────────────► n            │
│      0                                                     │
└─────────────────────────────────────────────────────────────┘
```

## 线性表

<CollapsibleIframe src="/learning-notes/demos/data-structure/data-structure.html" title="数据结构可视化演示" :height="600" />

### 数组

```c
typedef struct {
    int *data;
    size_t size;
    size_t capacity;
} ArrayList;
```

上述代码定义了动态数组的结构体：

**结构体成员说明：**

| 成员 | 类型 | 说明 |
|------|------|------|
| `data` | `int *` | 指向实际存储数据的内存块的指针，这是一个整型指针，指向堆上分配的连续内存空间 |
| `size` | `size_t` | 当前数组中实际存储的元素个数，`size_t` 是无符号整数类型，保证能表示任何对象的大小 |
| `capacity` | `size_t` | 数组的总容量，即 `data` 指向的内存块最多能存储多少个元素 |

**为什么需要 size 和 capacity 两个变量？**

`capacity` 表示"桶有多大"，`size` 表示"桶里装了多少"。当 `size == capacity` 时，数组满了，需要扩容。这种设计避免了每次插入都重新分配内存，提高了效率。

```c
ArrayList *array_list_create(size_t capacity)
{
    ArrayList *list = malloc(sizeof(ArrayList));
    if (list == NULL) return NULL;

    list->data = malloc(capacity * sizeof(int));
    if (list->data == NULL) {
        free(list);
        return NULL;
    }

    list->size = 0;
    list->capacity = capacity;
    return list;
}
```

上述代码实现了动态数组的创建函数：

**参数说明：**
- `capacity`：初始容量，指定数组最初能存储多少个元素

**返回值：**
- 成功：返回指向新创建的 `ArrayList` 结构体的指针
- 失败：返回 `NULL`（内存分配失败时）

**逐行解释：**

```c
ArrayList *list = malloc(sizeof(ArrayList));
```
这行代码在堆上分配 `ArrayList` 结构体大小的内存。`sizeof(ArrayList)` 计算结构体占用的字节数（在 64 位系统上通常是 24 字节：8 字节指针 + 8 字节 size_t + 8 字节 size_t）。`malloc` 返回的指针赋给 `list`。

```c
list->data = malloc(capacity * sizeof(int));
```
这行代码分配实际存储数据的内存。假设 `capacity = 10`，则分配 `10 * 4 = 40` 字节（`int` 通常占 4 字节）。这块内存用于存储数组元素。

```c
if (list->data == NULL) {
    free(list);
    return NULL;
}
```
如果数据内存分配失败，需要释放之前分配的结构体内存，避免内存泄漏。这是"分配失败时清理已分配资源"的标准模式。

```c
int array_list_get(ArrayList *list, size_t index)
{
    if (index >= list->size) return -1;
    return list->data[index];
}
```

上述代码实现了数组元素的获取：

**参数说明：**
- `list`：指向 `ArrayList` 结构体的指针
- `index`：要获取的元素索引（从 0 开始）

**返回值：**
- 成功：返回指定位置的元素值
- 失败：返回 -1（索引越界时）

**关键点：**
- `index >= list->size` 检查索引是否越界，注意是用 `size` 而不是 `capacity` 来判断
- `list->data[index]` 通过指针算术访问元素，等价于 `*(list->data + index)`

```c
int array_list_insert(ArrayList *list, size_t index, int value)
{
    if (index > list->size) return -1;

    if (list->size == list->capacity) {
        size_t new_capacity = list->capacity * 2;
        int *new_data = realloc(list->data, new_capacity * sizeof(int));
        if (new_data == NULL) return -1;
        list->data = new_data;
        list->capacity = new_capacity;
    }

    for (size_t i = list->size; i > index; i--) {
        list->data[i] = list->data[i - 1];
    }

    list->data[index] = value;
    list->size++;
    return 0;
}
```

上述代码实现了在指定位置插入元素：

**参数说明：**
- `list`：指向 `ArrayList` 结构体的指针
- `index`：插入位置（0 到 size 之间）
- `value`：要插入的值

**返回值：**
- 成功：返回 0
- 失败：返回 -1

**逐行解释：**

```c
if (list->size == list->capacity)
```
检查数组是否已满。当实际元素个数等于容量时，需要扩容。

```c
size_t new_capacity = list->capacity * 2;
```
新容量设为原来的 2 倍。这种"翻倍扩容"策略使得均摊时间复杂度为 O(1)。

```c
int *new_data = realloc(list->data, new_capacity * sizeof(int));
```
`realloc` 尝试扩展原有内存块。如果原位置后有足够空间，直接扩展；否则在别处分配新内存并复制数据。

```c
for (size_t i = list->size; i > index; i--) {
    list->data[i] = list->data[i - 1];
}
```
从后向前移动元素，为新元素腾出位置。例如在索引 1 处插入，需要把索引 1 及之后的元素都后移一位。

**操作时间复杂度：**

| 操作 | 时间复杂度 | 说明 |
|------|------------|------|
| 访问 | O(1) | 直接索引访问 |
| 查找 | O(n) | 遍历查找 |
| 插入 | O(n) | 需要移动元素 |
| 删除 | O(n) | 需要移动元素 |
| 扩容 | O(n) | 复制所有元素 |

### 链表

```c
typedef struct ListNode {
    int data;
    struct ListNode *next;
} ListNode;
```

上述代码定义了链表节点结构体：

**结构体成员说明：**

| 成员 | 类型 | 说明 |
|------|------|------|
| `data` | `int` | 存储节点的数据值，可以是任意类型 |
| `next` | `struct ListNode *` | 指向下一个节点的指针，形成链式结构 |

**为什么 `next` 的类型是 `struct ListNode *` 而不是 `ListNode *`？**

因为在结构体内部，`ListNode` 这个类型别名还没有定义完成，编译器不认识 `ListNode`。必须使用完整的 `struct ListNode` 来引用这个类型。这是 C 语言结构体自引用的标准写法。

```c
typedef struct {
    ListNode *head;
    size_t size;
} LinkedList;
```

上述代码定义了链表的控制结构：

**结构体成员说明：**

| 成员 | 类型 | 说明 |
|------|------|------|
| `head` | `ListNode *` | 指向链表第一个节点的指针，如果链表为空则为 `NULL` |
| `size` | `size_t` | 链表中节点的个数，便于快速获取链表长度 |

**链表 vs 数组的内存布局：**

```
┌─────────────────────────────────────────────────────────────┐
│                    数组 vs 链表内存布局                        │
│                                                             │
│  数组 (连续内存):                                            │
│  地址: 0x1000  0x1004  0x1008  0x100C  0x1010               │
│       ┌──────┬──────┬──────┬──────┬──────┐                  │
│       │  10  │  20  │  30  │  40  │  50  │                  │
│       └──────┴──────┴──────┴──────┴──────┘                  │
│       相邻元素地址差 4 字节，CPU 缓存友好                       │
│                                                             │
│  链表 (分散内存):                                            │
│  ┌──────┬──────┐     ┌──────┬──────┐     ┌──────┬──────┐   │
│  │ data │ next │────►│ data │ next │────►│ data │ next │   │
│  │  10  │ 0x50 │     │  20  │ 0x90 │     │  30  │ NULL │   │
│  └──────┴──────┘     └──────┴──────┘     └──────┴──────┘   │
│  地址: 0x10           地址: 0x50           地址: 0x90        │
│  节点分散在堆内存各处，需要通过指针访问                         │
└─────────────────────────────────────────────────────────────┘
```

```c
LinkedList *linked_list_create(void)
{
    LinkedList *list = malloc(sizeof(LinkedList));
    if (list) {
        list->head = NULL;
        list->size = 0;
    }
    return list;
}
```

上述代码实现了链表的创建：

**返回值：**
- 成功：返回指向新创建的 `LinkedList` 结构体的指针
- 失败：返回 `NULL`（内存分配失败时）

**关键点：**
- `list->head = NULL`：初始化头指针为空，表示链表为空
- `list->size = 0`：初始化节点个数为 0
- 注意：这里只分配了控制结构，没有分配任何节点

```c
ListNode *linked_list_get(LinkedList *list, size_t index)
{
    if (index >= list->size) return NULL;

    ListNode *node = list->head;
    for (size_t i = 0; i < index; i++) {
        node = node->next;
    }
    return node;
}
```

上述代码实现了链表节点的获取：

**参数说明：**
- `list`：指向链表控制结构的指针
- `index`：要获取的节点索引（从 0 开始）

**返回值：**
- 成功：返回指向目标节点的指针
- 失败：返回 `NULL`（索引越界时）

**逐行解释：**

```c
ListNode *node = list->head;
```
从链表头开始，`node` 指向第一个节点。

```c
for (size_t i = 0; i < index; i++) {
    node = node->next;
}
```
循环 `index` 次，每次让 `node` 指向下一个节点。这就是链表访问慢的原因——必须从头开始逐个遍历。

**为什么链表访问是 O(n) 而数组是 O(1)？**

数组可以通过基地址 + 偏移量直接计算出目标地址，一次内存访问即可。链表必须从头节点开始，沿着 `next` 指针逐个跳转，访问第 n 个节点需要 n 次指针跳转。

```c
int linked_list_insert(LinkedList *list, size_t index, int value)
{
    if (index > list->size) return -1;

    ListNode *new_node = malloc(sizeof(ListNode));
    if (new_node == NULL) return -1;
    new_node->data = value;

    if (index == 0) {
        new_node->next = list->head;
        list->head = new_node;
    } else {
        ListNode *prev = linked_list_get(list, index - 1);
        new_node->next = prev->next;
        prev->next = new_node;
    }

    list->size++;
    return 0;
}

int linked_list_delete(LinkedList *list, size_t index)
{
    if (index >= list->size) return -1;

    ListNode *to_delete;

    if (index == 0) {
        to_delete = list->head;
        list->head = list->head->next;
    } else {
        ListNode *prev = linked_list_get(list, index - 1);
        to_delete = prev->next;
        prev->next = to_delete->next;
    }

    free(to_delete);
    list->size--;
    return 0;
}
```

上述代码实现了单链表：

**链表 vs 数组：**

| 特性 | 数组 | 链表 |
|------|------|------|
| 内存 | 连续 | 分散 |
| 访问 | O(1) | O(n) |
| 插入删除 | O(n) | O(1) |
| 空间利用 | 高 | 低 (需要指针) |
| 缓存友好 | 是 | 否 |

### 双向链表

```c
typedef struct DListNode {
    int data;
    struct DListNode *prev;
    struct DListNode *next;
} DListNode;

typedef struct {
    DListNode *head;
    DListNode *tail;
    size_t size;
} DoublyLinkedList;

void dlist_push_front(DoublyLinkedList *list, int value)
{
    DListNode *new_node = malloc(sizeof(DListNode));
    new_node->data = value;
    new_node->prev = NULL;
    new_node->next = list->head;

    if (list->head) {
        list->head->prev = new_node;
    } else {
        list->tail = new_node;
    }

    list->head = new_node;
    list->size++;
}

void dlist_push_back(DoublyLinkedList *list, int value)
{
    DListNode *new_node = malloc(sizeof(DListNode));
    new_node->data = value;
    new_node->next = NULL;
    new_node->prev = list->tail;

    if (list->tail) {
        list->tail->next = new_node;
    } else {
        list->head = new_node;
    }

    list->tail = new_node;
    list->size++;
}
```

上述代码实现了双向链表：

**双向链表特点：**
- 可以双向遍历
- 插入删除更灵活
- 空间开销更大

## 栈与队列

### 栈

```c
typedef struct {
    int *data;
    size_t top;
    size_t capacity;
} Stack;

Stack *stack_create(size_t capacity)
{
    Stack *stack = malloc(sizeof(Stack));
    if (stack) {
        stack->data = malloc(capacity * sizeof(int));
        stack->top = 0;
        stack->capacity = capacity;
    }
    return stack;
}

bool stack_push(Stack *stack, int value)
{
    if (stack->top >= stack->capacity) return false;
    stack->data[stack->top++] = value;
    return true;
}

bool stack_pop(Stack *stack, int *value)
{
    if (stack->top == 0) return false;
    *value = stack->data[--stack->top];
    return true;
}

bool stack_peek(Stack *stack, int *value)
{
    if (stack->top == 0) return false;
    *value = stack->data[stack->top - 1];
    return true;
}

bool stack_is_empty(Stack *stack)
{
    return stack->top == 0;
}
```

上述代码实现了栈：

**栈的特点：**
- 后进先出 (LIFO)
- 只能在一端操作
- 时间复杂度：O(1)

**应用场景：**
- 函数调用栈
- 表达式求值
- 括号匹配
- 撤销操作

### 队列

```c
typedef struct {
    int *data;
    size_t front;
    size_t rear;
    size_t size;
    size_t capacity;
} Queue;

Queue *queue_create(size_t capacity)
{
    Queue *queue = malloc(sizeof(Queue));
    if (queue) {
        queue->data = malloc(capacity * sizeof(int));
        queue->front = 0;
        queue->rear = 0;
        queue->size = 0;
        queue->capacity = capacity;
    }
    return queue;
}

bool queue_enqueue(Queue *queue, int value)
{
    if (queue->size >= queue->capacity) return false;
    queue->data[queue->rear] = value;
    queue->rear = (queue->rear + 1) % queue->capacity;
    queue->size++;
    return true;
}

bool queue_dequeue(Queue *queue, int *value)
{
    if (queue->size == 0) return false;
    *value = queue->data[queue->front];
    queue->front = (queue->front + 1) % queue->capacity;
    queue->size--;
    return true;
}

bool queue_is_empty(Queue *queue)
{
    return queue->size == 0;
}
```

上述代码实现了循环队列：

**队列的特点：**
- 先进先出 (FIFO)
- 一端入队，一端出队
- 时间复杂度：O(1)

**应用场景：**
- 任务调度
- 消息队列
- 缓冲区
- BFS 遍历

## 树

### 二叉树

```c
typedef struct TreeNode {
    int data;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

TreeNode *tree_create_node(int data)
{
    TreeNode *node = malloc(sizeof(TreeNode));
    if (node) {
        node->data = data;
        node->left = NULL;
        node->right = NULL;
    }
    return node;
}
```

上述代码定义了二叉树节点：

### 二叉树遍历

```c
void tree_preorder(TreeNode *root)
{
    if (root == NULL) return;
    printf("%d ", root->data);
    tree_preorder(root->left);
    tree_preorder(root->right);
}

void tree_inorder(TreeNode *root)
{
    if (root == NULL) return;
    tree_inorder(root->left);
    printf("%d ", root->data);
    tree_inorder(root->right);
}

void tree_postorder(TreeNode *root)
{
    if (root == NULL) return;
    tree_postorder(root->left);
    tree_postorder(root->right);
    printf("%d ", root->data);
}

void tree_level_order(TreeNode *root)
{
    if (root == NULL) return;

    Queue *queue = queue_create(100);
    queue_enqueue(queue, (int)(size_t)root);

    while (!queue_is_empty(queue)) {
        TreeNode *node;
        queue_dequeue(queue, (int*)(size_t*)&node);
        printf("%d ", node->data);

        if (node->left) {
            queue_enqueue(queue, (int)(size_t)node->left);
        }
        if (node->right) {
            queue_enqueue(queue, (int)(size_t)node->right);
        }
    }
}
```

上述代码实现了四种遍历方式：

**遍历方式对比：**

```
┌─────────────────────────────────────────────────────────────┐
│                    二叉树遍历                                │
│                                                             │
│        4                                                    │
│       / \                                                   │
│      2   6                                                  │
│     / \ / \                                                 │
│    1  3 5  7                                                │
│                                                             │
│  前序遍历 (根-左-右): 4 2 1 3 6 5 7                         │
│  中序遍历 (左-根-右): 1 2 3 4 5 6 7 (升序)                  │
│  后序遍历 (左-右-根): 1 3 2 5 7 6 4                         │
│  层序遍历 (逐层):     4 2 6 1 3 5 7                         │
└─────────────────────────────────────────────────────────────┘
```

### 二叉搜索树

```c
TreeNode *bst_insert(TreeNode *root, int value)
{
    if (root == NULL) {
        return tree_create_node(value);
    }

    if (value < root->data) {
        root->left = bst_insert(root->left, value);
    } else if (value > root->data) {
        root->right = bst_insert(root->right, value);
    }

    return root;
}

TreeNode *bst_search(TreeNode *root, int value)
{
    if (root == NULL || root->data == value) {
        return root;
    }

    if (value < root->data) {
        return bst_search(root->left, value);
    } else {
        return bst_search(root->right, value);
    }
}

TreeNode *bst_find_min(TreeNode *root)
{
    while (root && root->left) {
        root = root->left;
    }
    return root;
}

TreeNode *bst_delete(TreeNode *root, int value)
{
    if (root == NULL) return NULL;

    if (value < root->data) {
        root->left = bst_delete(root->left, value);
    } else if (value > root->data) {
        root->right = bst_delete(root->right, value);
    } else {
        if (root->left == NULL) {
            TreeNode *temp = root->right;
            free(root);
            return temp;
        } else if (root->right == NULL) {
            TreeNode *temp = root->left;
            free(root);
            return temp;
        }

        TreeNode *successor = bst_find_min(root->right);
        root->data = successor->data;
        root->right = bst_delete(root->right, successor->data);
    }

    return root;
}
```

上述代码实现了二叉搜索树：

**BST 性质：**
- 左子树所有节点值 < 根节点值
- 右子树所有节点值 > 根节点值
- 中序遍历得到升序序列

**时间复杂度：**

| 操作 | 平均 | 最坏 |
|------|------|------|
| 查找 | O(log n) | O(n) |
| 插入 | O(log n) | O(n) |
| 删除 | O(log n) | O(n) |

## 堆

### 最大堆

```c
typedef struct {
    int *data;
    size_t size;
    size_t capacity;
} MaxHeap;

MaxHeap *heap_create(size_t capacity)
{
    MaxHeap *heap = malloc(sizeof(MaxHeap));
    if (heap) {
        heap->data = malloc((capacity + 1) * sizeof(int));
        heap->size = 0;
        heap->capacity = capacity;
    }
    return heap;
}

void heap_swap(int *a, int *b)
{
    int temp = *a;
    *a = *b;
    *b = temp;
}

void heap_sift_up(MaxHeap *heap, size_t index)
{
    while (index > 1 && heap->data[index] > heap->data[index / 2]) {
        heap_swap(&heap->data[index], &heap->data[index / 2]);
        index /= 2;
    }
}

void heap_sift_down(MaxHeap *heap, size_t index)
{
    while (2 * index <= heap->size) {
        size_t child = 2 * index;

        if (child < heap->size && heap->data[child + 1] > heap->data[child]) {
            child++;
        }

        if (heap->data[index] >= heap->data[child]) break;

        heap_swap(&heap->data[index], &heap->data[child]);
        index = child;
    }
}

void heap_push(MaxHeap *heap, int value)
{
    if (heap->size >= heap->capacity) return;

    heap->data[++heap->size] = value;
    heap_sift_up(heap, heap->size);
}

int heap_pop(MaxHeap *heap)
{
    if (heap->size == 0) return -1;

    int result = heap->data[1];
    heap->data[1] = heap->data[heap->size--];
    heap_sift_down(heap, 1);

    return result;
}
```

上述代码实现了最大堆：

**堆的性质：**
- 完全二叉树
- 每个节点值 ≥ 子节点值（最大堆）
- 每个节点值 ≤ 子节点值（最小堆）

**应用场景：**
- 堆排序
- 优先队列
- Top K 问题
- 合并有序链表

## 哈希表

### 哈希表实现

```c
#define HASH_TABLE_SIZE 1009

typedef struct HashNode {
    char *key;
    int value;
    struct HashNode *next;
} HashNode;

typedef struct {
    HashNode *buckets[HASH_TABLE_SIZE];
} HashTable;

unsigned int hash_function(const char *key)
{
    unsigned int hash = 5381;
    while (*key) {
        hash = ((hash << 5) + hash) + *key++;
    }
    return hash % HASH_TABLE_SIZE;
}

HashTable *hash_table_create(void)
{
    HashTable *table = calloc(1, sizeof(HashTable));
    return table;
}

void hash_table_put(HashTable *table, const char *key, int value)
{
    unsigned int index = hash_function(key);
    HashNode *node = table->buckets[index];

    while (node) {
        if (strcmp(node->key, key) == 0) {
            node->value = value;
            return;
        }
        node = node->next;
    }

    HashNode *new_node = malloc(sizeof(HashNode));
    new_node->key = strdup(key);
    new_node->value = value;
    new_node->next = table->buckets[index];
    table->buckets[index] = new_node;
}

int hash_table_get(HashTable *table, const char *key, int *found)
{
    unsigned int index = hash_function(key);
    HashNode *node = table->buckets[index];

    while (node) {
        if (strcmp(node->key, key) == 0) {
            *found = 1;
            return node->value;
        }
        node = node->next;
    }

    *found = 0;
    return 0;
}
```

上述代码实现了哈希表：

**哈希冲突解决：**

| 方法 | 说明 | 优缺点 |
|------|------|--------|
| 链地址法 | 每个桶维护链表 | 简单，但需要额外空间 |
| 开放地址法 | 冲突时找下一个空位 | 缓存友好，但易聚集 |
| 再哈希法 | 使用多个哈希函数 | 分散均匀，但计算多 |

## 图

### 图的表示

```c
#define MAX_VERTICES 100

typedef struct {
    int adjacency[MAX_VERTICES][MAX_VERTICES];
    int num_vertices;
} GraphMatrix;

typedef struct AdjListNode {
    int dest;
    int weight;
    struct AdjListNode *next;
} AdjListNode;

typedef struct {
    AdjListNode *head;
} AdjList;

typedef struct {
    AdjList array[MAX_VERTICES];
    int num_vertices;
} GraphList;
```

上述代码展示了两种图的表示方式：

**邻接矩阵 vs 邻接表：**

| 特性 | 邻接矩阵 | 邻接表 |
|------|----------|--------|
| 空间 | O(V²) | O(V+E) |
| 判断边 | O(1) | O(degree) |
| 遍历邻居 | O(V) | O(degree) |
| 适合 | 稠密图 | 稀疏图 |

### BFS 和 DFS

```c
void graph_bfs(GraphList *graph, int start, bool visited[])
{
    Queue *queue = queue_create(MAX_VERTICES);

    visited[start] = true;
    queue_enqueue(queue, start);

    while (!queue_is_empty(queue)) {
        int vertex;
        queue_dequeue(queue, &vertex);
        printf("%d ", vertex);

        AdjListNode *node = graph->array[vertex].head;
        while (node) {
            if (!visited[node->dest]) {
                visited[node->dest] = true;
                queue_enqueue(queue, node->dest);
            }
            node = node->next;
        }
    }
}

void graph_dfs(GraphList *graph, int vertex, bool visited[])
{
    visited[vertex] = true;
    printf("%d ", vertex);

    AdjListNode *node = graph->array[vertex].head;
    while (node) {
        if (!visited[node->dest]) {
            graph_dfs(graph, node->dest, visited);
        }
        node = node->next;
    }
}
```

上述代码实现了图的 BFS 和 DFS 遍历：

**BFS vs DFS：**

| 特性 | BFS | DFS |
|------|-----|-----|
| 数据结构 | 队列 | 栈/递归 |
| 空间复杂度 | O(V) | O(V) |
| 最短路径 | 无权图可以 | 不保证 |
| 应用 | 层次遍历 | 拓扑排序 |

## 总结

| 数据结构 | 查找 | 插入 | 删除 | 特点 |
|----------|------|------|------|------|
| 数组 | O(n) | O(n) | O(n) | 随机访问快 |
| 链表 | O(n) | O(1) | O(1) | 插入删除快 |
| 栈 | O(n) | O(1) | O(1) | LIFO |
| 队列 | O(n) | O(1) | O(1) | FIFO |
| BST | O(log n) | O(log n) | O(log n) | 有序 |
| 堆 | O(n) | O(log n) | O(log n) | 优先级 |
| 哈希表 | O(1) | O(1) | O(1) | 快速查找 |

## 参考资料

[1] 数据结构 (C 语言版). 严蔚敏

[2] Introduction to Algorithms. CLRS

[3] Algorithms. Robert Sedgewick

## 相关主题

- [数组与字符串](/notes/c/array-string) - C 语言数组操作
- [指针详解](/notes/c/pointer) - 链表实现基础
- [进程与线程](/notes/cs/process-thread) - 操作系统核心概念
