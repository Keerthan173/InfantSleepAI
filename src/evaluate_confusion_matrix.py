import pandas as pd
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt


def main():
    # Load CSV with features, true labels, and predicted labels
    test_data = pd.read_csv('data/combined/features_advanced_predictions.csv')

    # Extract labels
    y_true_int = test_data['label']
    y_pred_str = test_data['predicted_label_str']

    # Map integer true labels to string labels consistently
    label_map = {0: 'Normal', 1: 'Pre-apnea Warning', 2: 'Apnea'}
    y_true_str = y_true_int.map(label_map)

    # Define ordered class names for evaluation
    class_names = ['Normal', 'Pre-apnea Warning', 'Apnea']

    # Generate confusion matrix
    cm = confusion_matrix(y_true_str, y_pred_str, labels=class_names)

    # Plot confusion matrix heatmap
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')

    # Save as high-resolution PNG file
    plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')

    plt.show()

    # Generate and print classification report
    report = classification_report(y_true_str, y_pred_str, target_names=class_names)
    print(report)


if __name__ == '__main__':
    main()
